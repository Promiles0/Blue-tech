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
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayAgo = now.minusDays(1);
        LocalDateTime weekAgo = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);

        // 1. Revenue Metrics
        BigDecimal rev24h = orderRepository.calculateRevenueAfter(dayAgo);
        BigDecimal rev7d  = orderRepository.calculateRevenueAfter(weekAgo);
        BigDecimal rev30d = orderRepository.calculateRevenueAfter(monthAgo);
        BigDecimal totalRev = orderRepository.calculateTotalRevenue();
        Long orders30d = orderRepository.countByOrderedAtAfter(monthAgo);
        
        BigDecimal aov = BigDecimal.ZERO;
        if (orders30d != null && orders30d > 0 && rev30d != null) {
            aov = rev30d.divide(BigDecimal.valueOf(orders30d), 2, BigDecimal.ROUND_HALF_UP);
        }

        // 2. Counts
        Long totalOrders = orderRepository.count();
        Long totalCustomers = userRepository.count();
        Long totalVariants = variantRepository.count();
        Long lowStockCount = variantRepository.countByStockQuantityLessThan(5);

        // 3. Chart Series (14 days)
        List<DashboardStatsResponse.RevenuePoint> series = orderRepository.findRevenueByDayAfter(now.minusDays(14))
                .stream()
                .map(obj -> DashboardStatsResponse.RevenuePoint.builder()
                        .date(obj[0].toString())
                        .revenue((BigDecimal) obj[1])
                        .build())
                .collect(Collectors.toList());

        // 4. Alerts & Sellers
        List<DashboardStatsResponse.LowStockAlert> lowStock = variantRepository.findByStockQuantityLessThan(5)
                .stream()
                .limit(5)
                .map(v -> DashboardStatsResponse.LowStockAlert.builder()
                        .productName(v.getProduct().getName())
                        .variantInfo(v.getSizeOrColor())
                        .currentStock(v.getStockQuantity())
                        .build())
                .collect(Collectors.toList());

        List<DashboardStatsResponse.TopSeller> topSellers = orderRepository.findTopSellers()
                .stream()
                .limit(5)
                .map(obj -> DashboardStatsResponse.TopSeller.builder()
                        .productName((String) obj[0])
                        .totalQuantitySold((Long) obj[1])
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .revenue24h(rev24h != null ? rev24h : BigDecimal.ZERO)
                .revenue7d(rev7d != null ? rev7d : BigDecimal.ZERO)
                .revenue30d(rev30d != null ? rev30d : BigDecimal.ZERO)
                .totalRevenue(totalRev != null ? totalRev : BigDecimal.ZERO)
                .aov(aov)
                .orders30d(orders30d)
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalVariants(totalVariants)
                .lowStockCount(lowStockCount)
                .revenueSeries(series)
                .lowStockAlerts(lowStock)
                .topSellers(topSellers)
                .build();
    }
}
