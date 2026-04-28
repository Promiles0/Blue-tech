package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.CartItemRequest;
import com.ecom.Backend.dto.response.CartResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.CartService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    // GET /api/cart
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Cart fetched successfully", cartService.getCart(user)));
    }

    // POST /api/cart
    @PostMapping
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(@Valid @RequestBody CartItemRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cartService.addToCart(user, request)));
    }

    // DELETE /api/cart/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> removeFromCart(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        cartService.removeFromCart(user, id);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", null));
    }
}
