package com.ecom.Backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    
    private List<CartItemDetail> items;
    private BigDecimal cartTotal;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDetail {
        private Long cartItemId;
        private Long variantId;
        private String productName;
        private String sizeOrColor;
        private Integer quantity;
        private BigDecimal unitPrice; // Base Price + Adjustment
        private BigDecimal subTotal;
    }
}
