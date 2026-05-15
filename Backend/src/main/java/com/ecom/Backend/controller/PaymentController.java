package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.PaymentInitializationResponse;
import com.ecom.Backend.service.PaymentService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${app.flutterwave.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/initialize/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitializationResponse>> initialize(@PathVariable Long orderId) {
        PaymentInitializationResponse response = paymentService.initializePayment(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment initialized", response));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> payload,
                                              @RequestHeader("verif-hash") String verifHash) {
        if (webhookSecret.isBlank() || !webhookSecret.equals(verifHash)) {
            return ResponseEntity.status(401).build();
        }
        paymentService.processWebhook(payload);
        return ResponseEntity.ok().build();
    }
}
