package com.ecom.Backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDataResponse {

    private List<TopProduct> topProducts;
    private List<CategoryRevenue> byCategory;
    private List<UserGrowth> growth;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProduct {
        private String name;
        private BigDecimal revenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryRevenue {
        private String name;
        private BigDecimal value;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserGrowth {
        private String month;
        private long count;
    }
}
