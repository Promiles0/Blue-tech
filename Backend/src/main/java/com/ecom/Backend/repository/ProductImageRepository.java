package com.ecom.Backend.repository;

import com.ecom.Backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProduct_ProductId(Long productId);
    List<ProductImage> findByProduct_ProductIdAndIsPrimaryTrue(Long productId);
}
