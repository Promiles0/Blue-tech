package com.ecom.Backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    public void sendOrderConfirmation(String to, String orderId, String totalAmount) {
        String htmlContent = "<h1>Order Confirmation</h1>" +
                "<p>Thank you for your order! Your order ID is: <b>" + orderId + "</b></p>" +
                "<p>Total Amount: <b>" + totalAmount + " RWF</b></p>" +
                "<p>We are processing your delivery to your saved landmark.</p>";
        
        sendEmail(to, "Order Received - Order #" + orderId, htmlContent);
    }

    public void sendPasswordResetToken(String to, String token) {
        String htmlContent = "<h1>Password Reset</h1>" +
                "<p>You requested a password reset. Use the token below to reset your password:</p>" +
                "<h2 style='color: #007bff;'>" + token + "</h2>" +
                "<p>This token expires in 30 minutes.</p>";
        
        sendEmail(to, "Password Reset Request", htmlContent);
    }
}
