package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.PaymentInitializationResponse;
import com.ecom.Backend.service.PaymentService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ─── STRIPE ────────────────────────────────────────────────────────────────

    @PostMapping("/initialize/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitializationResponse>> initialize(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Payment initialized", paymentService.initializePayment(orderId)));
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.processStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    // ─── PAYPACK (MoMo / Airtel) ───────────────────────────────────────────────

    @PostMapping("/momo/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitializationResponse>> initiateMomo(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone number is required"));
        }
        return ResponseEntity.ok(ApiResponse.success("MoMo payment initiated",
                paymentService.initializeMomoPayment(orderId, phone)));
    }

    @PostMapping("/webhook/paypack")
    public ResponseEntity<Void> paypackWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Paypack-Signature", required = false) String signature) {
        if (signature == null || signature.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(rawBody, Map.class);
            paymentService.processPaypackWebhook(rawBody, signature, parsed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
