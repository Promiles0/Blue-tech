package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.service.OrderService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    // GET /api/admin/orders
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.success("All orders fetched", orderService.getAllOrders()));
    }

    // GET /api/admin/orders/{id}
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetails(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Order details fetched", orderService.getOrderById(orderId)));
    }
}
