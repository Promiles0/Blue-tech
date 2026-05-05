package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.CouponKind;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
    private Long couponId;
    private String code;
    private CouponKind kind;
    private BigDecimal value;
    private BigDecimal minSubtotal;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Integer maxUses;
    private Integer uses;
    private boolean isActive;
    private LocalDateTime createdAt;
}
