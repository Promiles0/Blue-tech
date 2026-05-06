package com.ecom.Backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewResponse {
    private Long reviewId;
    private String productName;
    private String authorName;
    private String authorEmail;
    private Integer rating;
    private String comment;
    private boolean isHidden;
    private LocalDateTime createdAt;
}
