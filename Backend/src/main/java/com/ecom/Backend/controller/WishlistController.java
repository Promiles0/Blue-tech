package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.WishlistResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.WishlistService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthService authService;

    // GET /api/wishlist
    @GetMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched successfully", wishlistService.getWishlist(user)));
    }

    // POST /api/wishlist/{productId} (Toggle logic)
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<String>> toggleWishlist(@PathVariable Long productId) {
        User user = authService.getCurrentAuthenticatedUser();
        wishlistService.toggleWishlist(user, productId);
        return ResponseEntity.ok(ApiResponse.success("Wishlist updated", null));
    }
}
