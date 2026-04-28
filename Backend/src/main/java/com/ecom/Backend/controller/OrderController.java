package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.OrderService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    // POST /api/orders/checkout
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout() {
        User user = authService.getCurrentAuthenticatedUser();
        OrderResponse response = orderService.checkout(user);
        return new ResponseEntity<>(
                ApiResponse.success("Order placed successfully!", response),
                HttpStatus.CREATED
        );
    }

    // PUT /api/orders/{id}/cancel
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelOrder(@PathVariable Long orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", null));
    }
}
