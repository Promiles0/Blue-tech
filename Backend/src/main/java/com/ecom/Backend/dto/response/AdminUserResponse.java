package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.RoleType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private RoleType role;
    private boolean isSuspended;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private int orderCount;
    private BigDecimal totalSpent;
}
