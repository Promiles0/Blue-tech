package com.ecom.Backend.controller;

import com.ecom.Backend.service.EmailService;
import com.ecom.Backend.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.mail.host=localhost",
        "spring.mail.port=25",
        "app.admin.email=admin@test.com",
        "app.admin.password=admin123",
        "app.admin.name=Admin",
        "app.admin.phone=+250780000000",
        "app.google.web-client-id=test-client-id",
        "app.stripe.secret-key=sk_test_dummy",
        "app.stripe.webhook-secret=whsec_dummy",
        "app.frontend.url=http://localhost:5173",
        "app.upload.dir=uploads",
        "jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "jwt.expiration=86400000",
        "spring.security.oauth2.client.registration.google.client-id=test",
        "spring.security.oauth2.client.registration.google.client-secret=test"
})
@AutoConfigureMockMvc
class PaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean PaymentService paymentService;
    @MockitoBean EmailService emailService;

    private final String validPayload = "{\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test\"}}}";

    @Test
    void webhook_validSignature_returns200() throws Exception {
        doNothing().when(paymentService).processStripeWebhook(anyString(), anyString());

        mockMvc.perform(post("/api/payments/webhook")
                        .header("Stripe-Signature", "t=123,v1=abc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload))
                .andExpect(status().isOk());

        verify(paymentService).processStripeWebhook(anyString(), anyString());
    }

    @Test
    void webhook_missingSignature_returns400() throws Exception {
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload))
                .andExpect(status().isBadRequest());

        verify(paymentService, never()).processStripeWebhook(anyString(), anyString());
    }
}
