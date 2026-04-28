package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.PasswordChangeRequest;
import com.ecom.Backend.dto.request.ProfileUpdateRequest;
import com.ecom.Backend.dto.response.UserResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        UserResponse response = UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        UserResponse response = authService.updateProfile(user, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", response));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        authService.changePassword(user, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
