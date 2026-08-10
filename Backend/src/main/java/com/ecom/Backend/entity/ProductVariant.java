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

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "decimal(10,2) default 0")
    @Builder.Default
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer stockQuantity;
}
