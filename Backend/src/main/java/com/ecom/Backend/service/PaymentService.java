package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.PaymentInitializationResponse;
import com.ecom.Backend.entity.Order;
import com.ecom.Backend.entity.PaymentRecord;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.PaymentRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate;

    @Value("${app.flutterwave.secret-key}")
    private String flutterwaveSecretKey;

    @Transactional
    public PaymentInitializationResponse initializePayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        String txRef = "ECOM-" + orderId + "-" + UUID.randomUUID().toString().substring(0, 8);

        // Prepare Flutterwave Request
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("tx_ref", txRef);
        requestBody.put("amount", order.getTotalAmount().toString());
        requestBody.put("currency", "RWF");
        requestBody.put("redirect_url", "http://localhost:3000/payment-success"); // Frontend Success Page
        
        Map<String, String> customer = new HashMap<>();
        customer.put("email", order.getUser().getEmail());
        customer.put("name", order.getUser().getName());
        requestBody.put("customer", customer);

        // API Call
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(flutterwaveSecretKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    "https://api.flutterwave.com/v3/payments",
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (response.getStatusCode() == HttpStatus.OK && body != null) {
                @SuppressWarnings("unchecked")
                Map<String, String> data = (Map<String, String>) body.get("data");
                String link = data.get("link");

                // Save Payment Record
                PaymentRecord paymentRecord = PaymentRecord.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .transactionReference(txRef)
                        .status("PENDING")
                        .build();
                paymentRepository.save(paymentRecord);

                return PaymentInitializationResponse.builder()
                        .status("success")
                        .message("Payment initialized")
                        .paymentLink(link)
                        .build();
            }
        } catch (Exception e) {
            throw new RuntimeException("Flutterwave initialization failed: " + e.getMessage());
        }

        throw new RuntimeException("Failed to initialize payment with Flutterwave");
    }

    @Transactional
    public void processWebhook(Map<String, Object> payload) {
        // 1. Verify payment status from payload
        String status = (String) payload.get("status");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        String txRef = (String) data.get("tx_ref");

        if ("successful".equalsIgnoreCase(status)) {
            PaymentRecord payment = paymentRepository.findByTransactionReference(txRef)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

            payment.setStatus("SUCCESS");
            payment.setPaymentMethod((String) data.get("payment_type"));
            paymentRepository.save(payment);

            // Update Order Status
            Order order = payment.getOrder();
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
        }
    }
}
