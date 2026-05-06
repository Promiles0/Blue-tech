package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Notification;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.NotificationAudience;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserAndAudienceOrderByCreatedAtDesc(
            User user, NotificationAudience audience, Pageable pageable);

    List<Notification> findByAudienceOrderByCreatedAtDesc(
            NotificationAudience audience, Pageable pageable);

    long countByUserAndIsReadFalse(User user);

    long countByAudienceAndIsReadFalse(NotificationAudience audience);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.user = :user AND n.isRead = false")
    int markAllReadForUser(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.notificationId IN :ids")
    int markReadByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.audience = :audience AND n.isRead = false")
    int markAllReadForAudience(@Param("audience") NotificationAudience audience);
}
