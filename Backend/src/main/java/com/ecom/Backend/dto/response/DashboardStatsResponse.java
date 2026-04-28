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
public class DashboardStatsResponse {
    
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long ordersToday;
    
    private List<LowStockAlert> lowStockAlerts;
    private List<TopSeller> topSellers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockAlert {
        private String productName;
        private String variantInfo;
        private Integer currentStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSeller {
        private String productName;
        private Long totalQuantitySold;
    }
}
