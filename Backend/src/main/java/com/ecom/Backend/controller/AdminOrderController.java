package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.AdminOrderDetailResponse;
import com.ecom.Backend.dto.response.AdminOrderListResponse;
import com.ecom.Backend.service.AdminOrderService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminOrderListResponse>>> listOrders(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Orders fetched",
                adminOrderService.listOrders(status)));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Order detail fetched",
                adminOrderService.getOrderDetail(orderId)));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> updateStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                adminOrderService.updateStatus(orderId, body.get("status"))));
    }

    @PostMapping("/{orderId}/payments")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> markPaid(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Order marked as paid",
                adminOrderService.markPaid(orderId)));
    }

    @PostMapping("/{orderId}/shipments")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> createShipment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Shipment created",
                adminOrderService.createShipment(orderId, body.get("carrier"), body.get("trackingNumber"))));
    }
}
