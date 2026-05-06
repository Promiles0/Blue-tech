package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.NotificationResponse;
import com.ecom.Backend.entity.Notification;
import com.ecom.Backend.entity.NotificationPreference;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.NotificationAudience;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.enums.NotificationSeverity;
import com.ecom.Backend.repository.NotificationPreferenceRepository;
import com.ecom.Backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    // ── Emit helpers ─────────────────────────────────────────────────────────

    public void emitUserNotification(User user, NotificationCategory category, NotificationSeverity severity,
                                     String title, String body, String href) {
        if (user == null) return;
        if (!isCategoryEnabled(user, category)) return;

        Notification n = Notification.builder()
                .audience(NotificationAudience.USER)
                .user(user)
                .category(category)
                .severity(severity)
                .title(title)
                .body(body)
                .href(href)
                .build();
        notificationRepository.save(n);
    }

    public void emitAdminNotification(NotificationCategory category, NotificationSeverity severity,
                                      String title, String body, String href) {
        Notification n = Notification.builder()
                .audience(NotificationAudience.ADMIN)
                .user(null)
                .category(category)
                .severity(severity)
                .title(title)
                .body(body)
                .href(href)
                .build();
        notificationRepository.save(n);
    }

    /**
     * Simple notification creation for service-to-service calls (e.g., ShipmentService)
     * Defaults to ORDER category with INFO severity and no href
     */
    public void createNotification(User user, String title, String message) {
        emitUserNotification(user, NotificationCategory.ORDER, NotificationSeverity.INFO, title, message, null);
    }

    // ── Read endpoints ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(User user, int limit) {
        return notificationRepository
                .findByUserAndAudienceOrderByCreatedAtDesc(user, NotificationAudience.USER, PageRequest.of(0, limit))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAdminNotifications(int limit) {
        return notificationRepository
                .findByAudienceOrderByCreatedAtDesc(NotificationAudience.ADMIN, PageRequest.of(0, limit))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional(readOnly = true)
    public long getAdminUnreadCount() {
        return notificationRepository.countByAudienceAndIsReadFalse(NotificationAudience.ADMIN);
    }

    // ── Mark read ─────────────────────────────────────────────────────────────

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.markAllReadForUser(user);
    }

    @Transactional
    public void markReadByIds(List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            notificationRepository.markReadByIds(ids);
        }
    }

    @Transactional
    public void markAllAdminRead() {
        notificationRepository.markAllReadForAudience(NotificationAudience.ADMIN);
    }

    // ── Preferences ───────────────────────────────────────────────────────────

    public void seedPreferencesForUser(User user) {
        if (preferenceRepository.existsByUser(user)) return;
        for (NotificationCategory cat : NotificationCategory.values()) {
            preferenceRepository.save(NotificationPreference.builder()
                    .user(user).category(cat).enabled(true).build());
        }
    }

    public List<NotificationPreference> getPreferences(User user) {
        seedPreferencesForUser(user);
        return preferenceRepository.findByUser(user);
    }

    @Transactional
    public void updatePreference(User user, NotificationCategory category, boolean enabled) {
        preferenceRepository.findByUserAndCategory(user, category).ifPresentOrElse(
                pref -> { pref.setEnabled(enabled); preferenceRepository.save(pref); },
                () -> preferenceRepository.save(NotificationPreference.builder()
                        .user(user).category(category).enabled(enabled).build())
        );
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private boolean isCategoryEnabled(User user, NotificationCategory category) {
        return preferenceRepository.findByUserAndCategory(user, category)
                .map(NotificationPreference::isEnabled)
                .orElse(true);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .audience(n.getAudience().name().toLowerCase())
                .category(n.getCategory().name().toLowerCase())
                .severity(n.getSeverity().name().toLowerCase())
                .title(n.getTitle())
                .body(n.getBody())
                .href(n.getHref())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
