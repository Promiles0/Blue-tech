package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.ResetPasswordRequest;
import com.ecom.Backend.dto.request.UserLoginRequest;
import com.ecom.Backend.dto.request.UserRegisterRequest;
import com.ecom.Backend.dto.response.AuthResponse;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody UserRegisterRequest request) {
        AuthResponse responseData = authService.registerUser(request);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully!", responseData), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody UserLoginRequest request) {
        AuthResponse responseData = authService.loginUser(request);
        return new ResponseEntity<>(ApiResponse.success("Login successful!", responseData), HttpStatus.OK);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        return ResponseEntity.ok(ApiResponse.success("If an account exists with this email, a reset token has been generated.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully.", null));
    }
}
