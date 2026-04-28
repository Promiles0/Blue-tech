package com.ecom.Backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true); // true = isHtml

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email to " + to, e);
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
