package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.ReviewRequest;
import com.ecom.Backend.dto.response.ReviewResponse;
import com.ecom.Backend.entity.Product;
import com.ecom.Backend.entity.Review;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.ProductRepository;
import com.ecom.Backend.repository.ReviewRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public ReviewResponse postReview(User user, Long productId, ReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        boolean hasPurchased = orderRepository.existsByUserAndProductAndStatus(user, product, OrderStatus.DELIVERED);
        if (!hasPurchased) {
            throw new RuntimeException("Only verified buyers can review this product.");
        }

        if (reviewRepository.existsByUserAndProduct(user, product)) {
            throw new RuntimeException("You have already reviewed this product.");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        updateProductRatingCache(product, request.getRating(), true);

        return mapToResponse(savedReview);
    }

    @Transactional
    public ReviewResponse updateReview(User user, Long reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You cannot edit someone else's review.");
        }

        LocalDateTime cutOffTime = review.getCreatedAt().plusHours(24);
        if (LocalDateTime.now().isAfter(cutOffTime) && !review.getRating().equals(request.getRating())) {
            throw new RuntimeException("Rating is locked after 24 hours.");
        }

        if (!review.getRating().equals(request.getRating())) {
            updateProductRatingOnEdit(review.getProduct(), review.getRating(), request.getRating());
            review.setRating(request.getRating());
        }

        review.setComment(request.getComment() + " (Edited)");
        Review updatedReview = reviewRepository.save(review);

        return mapToResponse(updatedReview);
    }

    @Transactional
    public void deleteReview(User user, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getUserId().equals(user.getUserId()) && !user.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("You cannot delete this review.");
        }

        Product product = review.getProduct();
        int currentCount = product.getReviewCount();
        if (currentCount > 0) {
            double currentAvg = product.getAverageRating();
            if (currentCount == 1) {
                product.setAverageRating(0.0);
            } else {
                double newAvg = ((currentAvg * currentCount) - review.getRating()) / (currentCount - 1);
                product.setAverageRating(newAvg);
            }
            product.setReviewCount(currentCount - 1);
            productRepository.save(product);
        }

        reviewRepository.delete(review);
    }

    public List<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProduct_ProductId(productId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void updateProductRatingCache(Product product, Integer newRating, boolean isNewReview) {
        double currentAvg = product.getAverageRating();
        int currentCount = product.getReviewCount();

        if (isNewReview) {
            double newAvg = ((currentAvg * currentCount) + newRating) / (currentCount + 1);
            product.setAverageRating(newAvg);
            product.setReviewCount(currentCount + 1);
        }
        productRepository.save(product);
    }

    private void updateProductRatingOnEdit(Product product, Integer oldRating, Integer newRating) {
        double currentAvg = product.getAverageRating();
        int currentCount = product.getReviewCount();

        if (currentCount > 0) {
            double newAvg = ((currentAvg * currentCount) - oldRating + newRating) / currentCount;
            product.setAverageRating(newAvg);
            productRepository.save(product);
        }
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
