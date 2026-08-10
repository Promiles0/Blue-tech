package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.PaymentInitializationResponse;
import com.ecom.Backend.entity.Order;
import com.ecom.Backend.entity.PaymentRecord;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.enums.NotificationSeverity;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @Value("${app.stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.stripe.webhook-secret}")
    private String stripeWebhookSecret;

    @Value("${app.paypack.app-id}")
    private String paypackAppId;

    @Value("${app.paypack.app-secret}")
    private String paypackAppSecret;

    @Value("${app.paypack.webhook-secret:}")
    private String paypackWebhookSecret;

    @Value("${app.paypack.base-url}")
    private String paypackBaseUrl;

    @Value("${app.paypack.usd-to-rwf-rate:1300}")
    private long usdToRwfRate;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    // ─── STRIPE ────────────────────────────────────────────────────────────────

    @Transactional
    public PaymentInitializationResponse initializePayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        long amountInCents = order.getTotalAmount().movePointRight(2).longValue();

        try {
            PaymentIntent intent = PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("usd")
                    .putMetadata("orderId", orderId.toString())
                    .putMetadata("userEmail", order.getUser().getEmail())
                    .build()
            );

            paymentRepository.save(PaymentRecord.builder()
                    .order(order)
                    .amount(order.getTotalAmount())
                    .transactionReference(intent.getId())
                    .status("PENDING")
                    .paymentMethod("card")
                    .build());

            return PaymentInitializationResponse.builder()
                    .status("success")
                    .message("Payment initialized")
                    .paymentLink(intent.getClientSecret())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Stripe initialization failed: " + e.getMessage());
        }
    }

    @Transactional
    public void processStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Invalid Stripe webhook signature");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject().orElseThrow(() -> new RuntimeException("Could not deserialize PaymentIntent"));

            PaymentRecord record = paymentRepository.findByTransactionReference(intent.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

            record.setStatus("SUCCESS");
            paymentRepository.save(record);
            markOrderPaid(record.getOrder());
        }
    }

    // ─── PAYPACK (MTN MoMo / Airtel Money) ─────────────────────────────────────

    @Transactional
    public PaymentInitializationResponse initializeMomoPayment(Long orderId, String phone) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        String accessToken = getPaypackToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        long amountInRwf = order.getTotalAmount()
                .multiply(java.math.BigDecimal.valueOf(usdToRwfRate))
                .longValue();

        Map<String, Object> body = Map.of(
            "amount", amountInRwf,
            "number", phone
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            paypackBaseUrl + "/transactions/cashin",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        Map<String, Object> data = response.getBody();
        if (data == null) throw new RuntimeException("Empty response from Paypack");

        String ref = (String) data.get("ref");
        if (ref == null) throw new RuntimeException("Paypack did not return a transaction ref");

        paymentRepository.save(PaymentRecord.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .transactionReference(ref)
                .status("PENDING")
                .paymentMethod(order.getPaymentMethod().name())
                .build());

        return PaymentInitializationResponse.builder()
                .status("success")
                .message("Payment request sent to " + phone + ". Please approve on your phone.")
                .paymentLink(ref)
                .build();
    }

    @Transactional
    public void processPaypackWebhook(String rawBody, String signatureHeader, Map<String, Object> payload) {
        if (paypackWebhookSecret == null || paypackWebhookSecret.isBlank()) {
            throw new RuntimeException("Paypack webhook secret is not configured");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(paypackWebhookSecret.getBytes(), "HmacSHA256"));
            String computed = Base64.getEncoder().encodeToString(mac.doFinal(rawBody.getBytes()));
            if (!computed.equals(signatureHeader)) {
                throw new RuntimeException("Invalid Paypack webhook signature");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Webhook signature verification failed");
        }

        // Per docs: top-level "kind" = "transaction:processed", status inside data
        String kind = (String) payload.get("kind");
        if (!"transaction:processed".equals(kind)) return;

        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        if (data == null) return;

        String ref = (String) data.get("ref");
        String status = (String) data.get("status");

        if ("successful".equalsIgnoreCase(status)) {
            paymentRepository.findByTransactionReference(ref).ifPresent(record -> {
                record.setStatus("SUCCESS");
                paymentRepository.save(record);
                markOrderPaid(record.getOrder());
            });
        } else if ("failed".equalsIgnoreCase(status)) {
            paymentRepository.findByTransactionReference(ref).ifPresent(record -> {
                record.setStatus("FAILED");
                paymentRepository.save(record);
                notificationService.emitUserNotification(
                    record.getOrder().getUser(), NotificationCategory.ORDER, NotificationSeverity.ERROR,
                    "Payment Failed",
                    "Your MoMo payment for order #" + record.getOrder().getOrderId() + " failed. Please try again.",
                    "/orders/" + record.getOrder().getOrderId()
                );
            });
        }
    }

    // ─── SHARED ─────────────────────────────────────────────────────────────────

    private String getPaypackToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
            "client_id", paypackAppId,
            "client_secret", paypackAppSecret
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            paypackBaseUrl + "/auth/agents/authorize",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        Map<String, Object> data = response.getBody();
        if (data == null) throw new RuntimeException("Paypack auth failed");

        String token = (String) data.get("access");
        if (token == null) throw new RuntimeException("Paypack did not return access token");
        return token;
    }

    private void markOrderPaid(Order order) {
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        notificationService.emitUserNotification(
            order.getUser(), NotificationCategory.ORDER, NotificationSeverity.SUCCESS,
            "Payment Confirmed",
            "Payment for order #" + order.getOrderId() + " was successful. Your order is now being processed.",
            "/orders/" + order.getOrderId()
        );

        notificationService.emitAdminNotification(
            NotificationCategory.ORDER, NotificationSeverity.INFO,
            "Order #" + order.getOrderId() + " Paid",
            order.getUser().getName() + " completed payment of $" + order.getTotalAmount(),
            "/admin/orders"
        );

        emailService.sendOrderConfirmation(
            order.getUser().getEmail(),
            order.getOrderId().toString(),
            order.getTotalAmount().toString()
        );
    }
}
