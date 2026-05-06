package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.AdminReviewResponse;
import com.ecom.Backend.entity.Review;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public List<AdminReviewResponse> listReviews(Integer rating) {
        List<Review> reviews;

        if (rating != null) {
            // This assumes this method already exists in your repository
            reviews = reviewRepository.findByRatingOrderByCreatedAtDesc(rating);
        } else {
            // ✅ FIX: use built-in pagination + sorting
            reviews = reviewRepository.findAll(
                    PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();
        }

        return reviews.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public AdminReviewResponse setHidden(Long reviewId, boolean hidden) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        review.setHidden(hidden);
        reviewRepository.save(review);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        String action = hidden ? "review.hide" : "review.show";

        auditLogService.log(
                adminId,
                action,
                "reviews",
                String.valueOf(reviewId),
                action + " review #" + reviewId,
                null
        );

        return toResponse(review);
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        reviewRepository.delete(review);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();

        auditLogService.log(
                adminId,
                "review.delete",
                "reviews",
                String.valueOf(reviewId),
                "Deleted review #" + reviewId,
                null
        );
    }

    private AdminReviewResponse toResponse(Review r) {
        return AdminReviewResponse.builder()
                .reviewId(r.getReviewId())
                .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                .authorName(r.getUser() != null ? r.getUser().getName() : null)
                .authorEmail(r.getUser() != null ? r.getUser().getEmail() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .isHidden(r.isHidden())
                .createdAt(r.getCreatedAt())
                .build();
    }
}