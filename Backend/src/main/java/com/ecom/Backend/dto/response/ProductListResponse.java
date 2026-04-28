package com.ecom.Backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListResponse {
    private Long productId;
    private String name;
    private String categoryName;
    private BigDecimal startingPrice; // The base price or the lowest variant price
    private String primaryImageUrl;
}
