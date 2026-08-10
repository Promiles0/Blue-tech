package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.AnalyticsDataResponse;
import com.ecom.Backend.dto.response.DashboardStatsResponse;
import com.ecom.Backend.service.AnalyticsService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched",
                analyticsService.getAdminStats()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsDataResponse>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success("Analytics fetched",
                analyticsService.getAnalytics()));
    }
}
