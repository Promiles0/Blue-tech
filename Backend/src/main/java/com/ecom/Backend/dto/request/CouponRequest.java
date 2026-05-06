package com.ecom.Backend.dto.request;

import com.ecom.Backend.enums.CouponKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {
    @NotBlank
    private String code;

    @NotNull
    private CouponKind kind;

    @NotNull @Positive
    private BigDecimal value;

    private BigDecimal minSubtotal;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Integer maxUses;
    private boolean isActive = true;
}
