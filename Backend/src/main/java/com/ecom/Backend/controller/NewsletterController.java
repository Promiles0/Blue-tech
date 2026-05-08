package com.ecom.Backend.controller;

import com.ecom.Backend.model.NewsletterSubscriber;
import com.ecom.Backend.repository.NewsletterSubscriberRepository;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterSubscriberRepository repository;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<String>> subscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid email address"));
        }

        if (repository.existsByEmail(email)) {
            return ResponseEntity.ok(ApiResponse.success("You are already subscribed!", null));
        }

        NewsletterSubscriber subscriber = Objects.requireNonNull(NewsletterSubscriber.builder()
                .email(email)
                .build());

        repository.save(subscriber);

        return ResponseEntity.ok(ApiResponse.success("Successfully subscribed to newsletter!", null));
    }
}
