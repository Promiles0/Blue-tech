package com.ecom.Backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long notificationId;
    private String audience;
    private String category;
    private String severity;
    private String title;
    private String body;
    private String href;
    private boolean isRead;
    private LocalDateTime createdAt;
}
