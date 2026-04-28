package com.ecom.Backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long variantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, unique = true)
    private String skuCode;

    @Column(nullable = false)
    private String sizeOrColor;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAdjustment;

    @Column(nullable = false)
    private Integer stockQuantity;
}
