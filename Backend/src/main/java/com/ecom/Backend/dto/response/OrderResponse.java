package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    
    private Long orderId;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private String shippingMethod;
    private String paymentMethod;
    private OrderStatus status;
    private LocalDateTime createdAt;
    
    // Snapshotted address info
    private String shippingStreet;
    private String shippingCity;
    private String shippingCountry;
    private String shippingPhoneNumber;
    private String shippingLandmarks;
    private String shippingRecipient;
    
    private List<OrderItemResponse> items;
    private ShipmentInfo shipmentInfo;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemResponse {
        private String productName;
        private String variantInfo;
        private Integer quantity;
        private BigDecimal priceAtPurchase;
        private BigDecimal subtotal;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ShipmentInfo {
        private String carrier;
        private String trackingNumber;
        private String status;
        private LocalDateTime shippedAt;
    }
}
