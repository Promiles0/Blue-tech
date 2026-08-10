package com.ecom.Backend.repository;

import com.ecom.Backend.entity.NotificationPreference;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    List<NotificationPreference> findByUser(User user);

    Optional<NotificationPreference> findByUserAndCategory(User user, NotificationCategory category);

    boolean existsByUser(User user);
}
