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
    
    private BigDecimal revenue24h;
    private BigDecimal revenue7d;
    private BigDecimal revenue30d;
    private BigDecimal totalRevenue;
    private BigDecimal aov;
    
    private Long orders30d;
    private Long totalOrders;
    private Long totalCustomers;
    private Long totalVariants;
    private Long ordersToday;
    private Long lowStockCount;
    
    private List<LowStockAlert> lowStockAlerts;
    private List<TopSeller> topSellers;
    private List<RevenuePoint> revenueSeries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenuePoint {
        private String date;
        private BigDecimal revenue;
    }

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
