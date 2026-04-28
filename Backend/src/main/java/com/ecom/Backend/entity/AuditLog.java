package com.ecom.Backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    // Many audit logs could belong to a user, but we can just store the ID directly
    // since the user might be deleted, and we don't want to lose the log or cause constraints.
    // Or we can map it. For absolute safety of logs, keeping it as just Long is sometimes preferred,
    // but mapping @ManyToOne is also fine. We'll use a direct reference for simplicity per ERD.
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String targetTable;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String ipAddress;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
