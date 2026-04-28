package com.ecom.Backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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
public class ProductCreateRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @NotNull(message = "Base price is required")
    @Min(value = 0, message = "Price cannot be negative")
    private BigDecimal price;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    // @Valid ensures Spring validates every item inside the list
    @Valid
    @NotNull(message = "At least one variant is required")
    private List<VariantRequest> variants;

    @Valid
    private List<ImageRequest> images;

    // --- NESTED CLASSES FOR CLEAN ORGANIZATION ---

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantRequest {
        @NotBlank(message = "SKU is required")
        private String skuCode;

        private String sizeOrColor;

        @Min(value = 0, message = "Price adjustment cannot be negative")
        private BigDecimal priceAdjustment;

        @Min(value = 0, message = "Stock cannot be negative")
        private Integer stockQuantity = 0; // Default to 0 if not provided
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageRequest {
        @NotBlank(message = "Image URL is required")
        private String imageUrl;

        private Boolean isPrimary = false;
    }
}
