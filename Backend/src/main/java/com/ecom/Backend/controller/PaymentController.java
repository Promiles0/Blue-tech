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

    @PostMapping("/initialize/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitializationResponse>> initialize(@PathVariable Long orderId) {
        PaymentInitializationResponse response = paymentService.initializePayment(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment initialized", response));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> payload, 
                                            @RequestHeader("verif-hash") String verifHash) {
        // In production, compare verifHash with your app.flutterwave.webhook-secret
        paymentService.processWebhook(payload);
        return ResponseEntity.ok().build();
    }
}
