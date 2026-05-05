package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private BigDecimal revenue24h;
    private BigDecimal revenue7d;
    private BigDecimal revenue30d;
    private BigDecimal aov;
    private Long orders30d;
    private Long totalCustomers;
    private Long lowStockCount;
    private Long pendingOrders;
    private Long newCustomers24h;
    private Map<String, Long> ordersByStatus;

    private List<DayRevenue> revenueSeries;
    private List<LowStockAlert> lowStockAlerts;
    private List<RecentOrder> recentOrders;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DayRevenue {
        private String date;
        private BigDecimal revenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LowStockAlert {
        private String productName;
        private String skuCode;
        private Integer currentStock;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecentOrder {
        private Long orderId;
        private String customerName;
        private BigDecimal totalAmount;
        private OrderStatus status;
        private LocalDateTime orderedAt;
    }
}
