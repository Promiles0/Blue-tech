package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    @EntityGraph(attributePaths = {"images", "category"})
    @NonNull
    Page<Product> findAll(@Nullable Specification<Product> spec, @NonNull Pageable pageable);

    @EntityGraph(attributePaths = {"images", "category"})
    @NonNull
    Page<Product> findAll(@NonNull Pageable pageable);

    @EntityGraph(attributePaths = {"images", "category"})
    List<Product> findByCategory_CategoryId(Long categoryId);
}
