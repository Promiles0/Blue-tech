package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Product;
import com.ecom.Backend.entity.Wishlist;
import com.ecom.Backend.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    Optional<WishlistItem> findByWishlistAndProduct(Wishlist wishlist, Product product);
}
