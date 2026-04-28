package com.ecom.Backend.entity;

import com.ecom.Backend.enums.RoleType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users") // 'user' is often a reserved keyword in some databases
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    private String passwordHash; // Nullable for Google Login users

    private String phone;

    private String provider;   // e.g. "google", "local"
    private String providerId; // ID from google

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastLogin;

    private String resetToken;
    private LocalDateTime resetTokenExpiry;
    
    // Relationships mapping (optional depending on how tight you want the coupling, but good for MVP)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Cart cart;
}
