package com.ecom.Backend.controller;

import com.ecom.Backend.entity.AuditLog;
import com.ecom.Backend.service.AuditLogService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAllLogs() {
        return ResponseEntity.ok(ApiResponse.success("Audit logs fetched successfully", auditLogService.getAllLogs()));
    }
}
