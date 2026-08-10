package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderListResponse {
    private Long orderId;
    private String customerName;
    private String customerEmail;
    private int itemCount;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private LocalDateTime orderedAt;
}
