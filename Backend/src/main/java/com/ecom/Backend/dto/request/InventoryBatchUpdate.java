package com.ecom.Backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryBatchUpdate {
    
    private List<VariantStockUpdate> updates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantStockUpdate {
        @NotNull(message = "Variant ID is required")
        private Long variantId;

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        private Integer quantity;
    }
}
