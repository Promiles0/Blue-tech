package com.ecom.Backend.entity;

import com.ecom.Backend.enums.NotificationCategory;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255)")
    private NotificationCategory category;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT true")
    private boolean enabled = true;
}
