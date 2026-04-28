package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.DashboardStatsResponse;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.ProductVariantRepository;
import com.ecom.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    public DashboardStatsResponse getAdminStats() {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);

        // 1. Core Metrics
        BigDecimal revenue = orderRepository.calculateTotalRevenue();
        Long totalOrders = orderRepository.count();
        Long totalCustomers = userRepository.count();
        Long ordersToday = orderRepository.countByOrderedAtAfter(yesterday);

        // 2. Low Stock Alerts (Under 5 items)
        List<DashboardStatsResponse.LowStockAlert> lowStock = variantRepository.findByStockQuantityLessThan(5)
                .stream()
                .map(v -> DashboardStatsResponse.LowStockAlert.builder()
                        .productName(v.getProduct().getName())
                        .variantInfo(v.getSizeOrColor())
                        .currentStock(v.getStockQuantity())
                        .build())
                .collect(Collectors.toList());

        // 3. Top Sellers (By Quantity)
        List<DashboardStatsResponse.TopSeller> topSellers = orderRepository.findTopSellers()
                .stream()
                .limit(5)
                .map(obj -> DashboardStatsResponse.TopSeller.builder()
                        .productName((String) obj[0])
                        .totalQuantitySold((Long) obj[1])
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .ordersToday(ordersToday)
                .lowStockAlerts(lowStock)
                .topSellers(topSellers)
                .build();
    }
}
