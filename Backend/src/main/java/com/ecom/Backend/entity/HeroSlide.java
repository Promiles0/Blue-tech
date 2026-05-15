package com.ecom.Backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hero_slides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroSlide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slideId;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private String label;

    private String altText;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
