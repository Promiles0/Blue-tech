package com.ecom.Backend.repository;

import com.ecom.Backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findBySkuCode(String skuCode);

    // Atomic Stock Reduction: Only updates if current stock is >= requested quantity.
    // Returns 1 if successful, 0 if out of stock.
    @Modifying
    @Query("UPDATE ProductVariant pv SET pv.stockQuantity = pv.stockQuantity - :quantity " +
           "WHERE pv.variantId = :variantId AND pv.stockQuantity >= :quantity")
    int reduceStockAtomic(@Param("variantId") Long variantId, @Param("quantity") Integer quantity);

    List<ProductVariant> findByStockQuantityLessThan(Integer threshold);
    Long countByStockQuantityLessThan(Integer threshold);
}
