package com.ecom.Backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateRequest {
    
    @NotBlank(message = "Product name is required")
    private String name;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Base price is required")
    private BigDecimal price;
    
    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private List<VariantUpdateRequest> variants;
    private List<ImageUpdateRequest> images;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantUpdateRequest {
        private Long variantId; // Optional for new variants
        private String skuCode;
        private String sizeOrColor;
        private BigDecimal priceAdjustment;
        private Integer stockQuantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageUpdateRequest {
        private Long imageId; // Optional for new images
        private String imageUrl;
        private Boolean isPrimary;
    }
}
