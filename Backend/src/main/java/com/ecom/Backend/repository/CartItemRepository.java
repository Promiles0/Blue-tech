package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Cart;
import com.ecom.Backend.entity.CartItem;
import com.ecom.Backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart(Cart cart);
    Optional<CartItem> findByCartAndVariant(Cart cart, ProductVariant variant);
}
