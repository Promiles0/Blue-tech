package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.AdminUserResponse;
import com.ecom.Backend.service.AdminUserService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success("Users fetched",
                adminUserService.listUsers(search)));
    }

    @PatchMapping("/{userId}/admin")
    public ResponseEntity<ApiResponse<AdminUserResponse>> setAdmin(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(ApiResponse.success("Role updated",
                adminUserService.setAdminRole(userId, Boolean.TRUE.equals(body.get("make")))));
    }

    @PatchMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<AdminUserResponse>> setSuspend(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(ApiResponse.success("Suspension updated",
                adminUserService.setSuspended(userId, Boolean.TRUE.equals(body.get("suspend")))));
    }
}
