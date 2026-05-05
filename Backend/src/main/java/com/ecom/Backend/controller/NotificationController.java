package com.ecom.Backend.controller;

import com.ecom.Backend.dto.response.NotificationResponse;
import com.ecom.Backend.entity.NotificationPreference;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.NotificationService;
import com.ecom.Backend.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    // GET /api/notifications?limit=30
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "30") int limit) {
        User user = authService.getCurrentAuthenticatedUser();
        List<NotificationResponse> list = notificationService.getUserNotifications(user, limit);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", list));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Unread count", notificationService.getUnreadCount(user)));
    }

    // POST /api/notifications/mark-read
    @PostMapping("/mark-read")
    public ResponseEntity<ApiResponse<Void>> markRead(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        notificationService.markReadByIds(ids);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    // POST /api/notifications/mark-all-read
    @PostMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        User user = authService.getCurrentAuthenticatedUser();
        notificationService.markAllRead(user);
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }

    // GET /api/notifications/preferences
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreference>>> getPreferences() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Preferences fetched", notificationService.getPreferences(user)));
    }

    // PATCH /api/notifications/preferences/{category}
    @PatchMapping("/preferences/{category}")
    public ResponseEntity<ApiResponse<Void>> updatePreference(
            @PathVariable String category,
            @RequestBody Map<String, Boolean> body) {
        User user = authService.getCurrentAuthenticatedUser();
        NotificationCategory cat = NotificationCategory.valueOf(category.toUpperCase());
        boolean enabled = body.getOrDefault("enabled", true);
        notificationService.updatePreference(user, cat, enabled);
        return ResponseEntity.ok(ApiResponse.success("Preference updated", null));
    }

    // GET /api/notifications/admin?limit=50 (admin only — secured at security config)
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAdminNotifications(
            @RequestParam(defaultValue = "50") int limit) {
        List<NotificationResponse> list = notificationService.getAdminNotifications(limit);
        return ResponseEntity.ok(ApiResponse.success("Admin notifications fetched", list));
    }

    // GET /api/notifications/admin/unread-count
    @GetMapping("/admin/unread-count")
    public ResponseEntity<ApiResponse<Long>> getAdminUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success("Admin unread count", notificationService.getAdminUnreadCount()));
    }

    // POST /api/notifications/admin/mark-all-read
    @PostMapping("/admin/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAdminRead() {
        notificationService.markAllAdminRead();
        return ResponseEntity.ok(ApiResponse.success("All admin notifications marked as read", null));
    }
}
