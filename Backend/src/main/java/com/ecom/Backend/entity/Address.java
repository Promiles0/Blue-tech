package com.ecom.Backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long addressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String recipientName;

    @Column(nullable = false)
    private String phoneNumber; // Critical for delivery drivers

    @Column(nullable = false)
    private String streetAddress;

    @Column(nullable = false)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String landmarks; // e.g., "Near the BK Branch"

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isDefault = false;
}
