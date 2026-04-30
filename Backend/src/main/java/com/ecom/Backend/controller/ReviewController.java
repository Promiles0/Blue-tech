package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.ReviewRequest;
import com.ecom.Backend.dto.response.ReviewResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.ReviewService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthService authService;

    // POST /api/products/{id}/reviews
    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> postReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request) {
        
        User user = authService.getCurrentAuthenticatedUser();
        ReviewResponse response = reviewService.postReview(user, productId, request);
        return new ResponseEntity<>(
                ApiResponse.success("Review posted successfully", response),
                HttpStatus.CREATED
        );
    }

    // PUT /api/reviews/{id}
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request) {
        
        User user = authService.getCurrentAuthenticatedUser();
        ReviewResponse response = reviewService.updateReview(user, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully", response));
    }

    // GET /api/products/{id}/reviews
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getProductReviews(@PathVariable Long productId) {
        List<ReviewResponse> reviews = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched successfully", reviews));
    }

    // DELETE /api/reviews/{id}
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long reviewId) {
        User user = authService.getCurrentAuthenticatedUser();
        reviewService.deleteReview(user, reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully", null));
    }
}
