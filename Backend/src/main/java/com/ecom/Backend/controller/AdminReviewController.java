package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.AdminReviewResponse;
import com.ecom.Backend.service.AdminReviewService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminReviewResponse>>> listReviews(
            @RequestParam(required = false) Integer rating) {
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched",
                adminReviewService.listReviews(rating)));
    }

    @PatchMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<AdminReviewResponse>> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(ApiResponse.success("Review updated",
                adminReviewService.setHidden(reviewId, Boolean.TRUE.equals(body.get("isHidden")))));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long reviewId) {
        adminReviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }
}
