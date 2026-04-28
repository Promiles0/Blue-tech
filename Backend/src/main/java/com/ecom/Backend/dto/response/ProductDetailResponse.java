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
public class ProductDetailResponse {

    private Long productId;
    private String name;
    private String description;
    private BigDecimal price;
    private String categoryName;

    private List<VariantResponse> variants;
    private List<ImageResponse> images;

    // --- NESTED CLASSES ---

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantResponse {
        private Long variantId;
        private String skuCode;
        private String sizeOrColor;
        private BigDecimal priceAdjustment;
        private Integer stockQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageResponse {
        private Long imageId;
        private String imageUrl;
        private Boolean isPrimary;
    }
}
