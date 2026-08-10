package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.enums.PaymentMethod;
import com.ecom.Backend.enums.PaymentStatus;
import com.ecom.Backend.enums.ShipmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderDetailResponse {
    private Long orderId;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private LocalDateTime orderedAt;

    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private String addressStreet;
    private String addressCity;
    private String addressCountry;

    private List<ItemLine> items;
    private PaymentInfo payment;
    private ShipmentInfo shipment;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemLine {
        private String productName;
        private String variantInfo;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PaymentInfo {
        private Long paymentId;
        private PaymentMethod method;
        private PaymentStatus status;
        private BigDecimal amount;
        private LocalDateTime paidAt;
        private String transactionReference;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ShipmentInfo {
        private Long shipmentId;
        private String carrier;
        private String trackingNumber;
        private ShipmentStatus status;
        private LocalDateTime shippedAt;
    }
}
