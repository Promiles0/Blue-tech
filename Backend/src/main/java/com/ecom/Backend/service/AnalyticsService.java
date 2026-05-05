package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.AnalyticsDataResponse;
import com.ecom.Backend.dto.response.DashboardStatsResponse;
import com.ecom.Backend.entity.Order;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.ProductVariantRepository;
import com.ecom.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import com.ecom.Backend.enums.OrderStatus;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    public DashboardStatsResponse getAdminStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime minus24h  = now.minusHours(24);
        LocalDateTime minus7d   = now.minusDays(7);
        LocalDateTime minus30d  = now.minusDays(30);

        BigDecimal rev24h  = orderRepository.calculateRevenueAfter(minus24h);
        BigDecimal rev7d   = orderRepository.calculateRevenueAfter(minus7d);
        BigDecimal rev30d  = orderRepository.calculateRevenueAfter(minus30d);

        Long orders30d      = orderRepository.countByOrderedAtAfterAndNotCancelled(minus30d);
        Long totalCustomers = userRepository.count();

        BigDecimal aov = (orders30d > 0)
                ? rev30d.divide(BigDecimal.valueOf(orders30d), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 14-day revenue series
        List<DashboardStatsResponse.DayRevenue> series = build14DaySeries();

        // Low stock
        List<DashboardStatsResponse.LowStockAlert> lowStock = variantRepository.findByStockQuantityLessThan(5)
                .stream()
                .map(v -> DashboardStatsResponse.LowStockAlert.builder()
                        .productName(v.getProduct().getName())
                        .skuCode(v.getSkuCode())
                        .currentStock(v.getStockQuantity())
                        .build())
                .collect(Collectors.toList());

        // Order pipeline by status
        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countGroupedByStatus()) {
            OrderStatus s = (OrderStatus) row[0];
            Long cnt = ((Number) row[1]).longValue();
            ordersByStatus.put(s.name(), cnt);
        }
        Long pendingOrders = ordersByStatus.getOrDefault(OrderStatus.PENDING.name(), 0L);

        // New customers in last 24h
        Long newCustomers24h = userRepository.countByCreatedAtAfter(minus24h);

        // Recent 5 orders
        List<DashboardStatsResponse.RecentOrder> recentOrders = orderRepository.findTop5ByOrderByOrderedAtDesc()
                .stream()
                .map(o -> DashboardStatsResponse.RecentOrder.builder()
                        .orderId(o.getOrderId())
                        .customerName(o.getUser() != null ? o.getUser().getName() : "Guest")
                        .totalAmount(o.getTotalAmount())
                        .status(o.getStatus())
                        .orderedAt(o.getOrderedAt())
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .revenue24h(rev24h != null ? rev24h : BigDecimal.ZERO)
                .revenue7d(rev7d != null ? rev7d : BigDecimal.ZERO)
                .revenue30d(rev30d != null ? rev30d : BigDecimal.ZERO)
                .aov(aov)
                .orders30d(orders30d)
                .totalCustomers(totalCustomers)
                .lowStockCount((long) lowStock.size())
                .pendingOrders(pendingOrders)
                .newCustomers24h(newCustomers24h != null ? newCustomers24h : 0L)
                .ordersByStatus(ordersByStatus)
                .revenueSeries(series)
                .lowStockAlerts(lowStock)
                .recentOrders(recentOrders)
                .build();
    }

    public AnalyticsDataResponse getAnalytics() {
        // Top products by revenue (top 8)
        List<AnalyticsDataResponse.TopProduct> topProducts = orderRepository.findTopProductsByRevenue()
                .stream()
                .limit(8)
                .map(row -> AnalyticsDataResponse.TopProduct.builder()
                        .name((String) row[0])
                        .revenue(row[1] instanceof BigDecimal ? (BigDecimal) row[1]
                                : BigDecimal.valueOf(((Number) row[1]).doubleValue()))
                        .build())
                .collect(Collectors.toList());

        // Revenue by category
        List<AnalyticsDataResponse.CategoryRevenue> byCategory = orderRepository.findRevenueByCategory()
                .stream()
                .map(row -> AnalyticsDataResponse.CategoryRevenue.builder()
                        .name((String) row[0])
                        .value(row[1] instanceof BigDecimal ? (BigDecimal) row[1]
                                : BigDecimal.valueOf(((Number) row[1]).doubleValue()))
                        .build())
                .collect(Collectors.toList());

        // User growth by month
        List<AnalyticsDataResponse.UserGrowth> growth = buildUserGrowth();

        return AnalyticsDataResponse.builder()
                .topProducts(topProducts)
                .byCategory(byCategory)
                .growth(growth)
                .build();
    }

    private List<DashboardStatsResponse.DayRevenue> build14DaySeries() {
        LocalDateTime from = LocalDateTime.now().minusDays(13).toLocalDate().atStartOfDay();
        List<Order> recentOrders = orderRepository.findAllByOrderByOrderedAtDesc().stream()
                .filter(o -> o.getOrderedAt() != null && o.getOrderedAt().isAfter(from))
                .collect(Collectors.toList());

        Map<String, BigDecimal> buckets = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 13; i >= 0; i--) {
            buckets.put(LocalDate.now().minusDays(i).format(fmt), BigDecimal.ZERO);
        }

        for (Order o : recentOrders) {
            if (o.getTotalAmount() == null) continue;
            String key = o.getOrderedAt().toLocalDate().format(fmt);
            buckets.merge(key, o.getTotalAmount(), BigDecimal::add);
        }

        return buckets.entrySet().stream()
                .map(e -> DashboardStatsResponse.DayRevenue.builder()
                        .date(e.getKey()).revenue(e.getValue()).build())
                .collect(Collectors.toList());
    }

    private List<AnalyticsDataResponse.UserGrowth> buildUserGrowth() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Long> buckets = new TreeMap<>();
        userRepository.findAllByOrderByCreatedAtDesc().forEach(u -> {
            if (u.getCreatedAt() != null) {
                String key = u.getCreatedAt().format(fmt);
                buckets.merge(key, 1L, Long::sum);
            }
        });
        return buckets.entrySet().stream()
                .map(e -> AnalyticsDataResponse.UserGrowth.builder()
                        .month(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());
    }
}
