package com.ecom.Backend.controller;

import com.ecom.Backend.service.EmailService;
import com.ecom.Backend.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
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
        "app.flutterwave.secret-key=test-secret",
        "app.flutterwave.webhook-secret=my_secret_hash",
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

    private final Map<String, Object> validPayload = Map.of(
            "status", "successful",
            "data", Map.of("tx_ref", "ECOM-1-abc12345", "payment_type", "card")
    );

    @Test
    void webhook_validHash_returns200() throws Exception {
        doNothing().when(paymentService).processWebhook(any());

        mockMvc.perform(post("/api/payments/webhook")
                        .header("verif-hash", "my_secret_hash")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPayload)))
                .andExpect(status().isOk());

        verify(paymentService).processWebhook(any());
    }

    @Test
    void webhook_invalidHash_returns401() throws Exception {
        mockMvc.perform(post("/api/payments/webhook")
                        .header("verif-hash", "wrong_hash")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPayload)))
                .andExpect(status().isUnauthorized());

        verify(paymentService, never()).processWebhook(any());
    }

    @Test
    void webhook_missingHash_returns400() throws Exception {
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPayload)))
                .andExpect(status().isBadRequest());

        verify(paymentService, never()).processWebhook(any());
    }
}
