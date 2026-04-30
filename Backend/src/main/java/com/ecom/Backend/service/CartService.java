package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.CartItemRequest;
import com.ecom.Backend.dto.response.CartResponse;
import com.ecom.Backend.entity.Cart;
import com.ecom.Backend.entity.CartItem;
import com.ecom.Backend.entity.ProductVariant;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.repository.CartItemRepository;
import com.ecom.Backend.repository.CartRepository;
import com.ecom.Backend.repository.ProductVariantRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;

    // Helper to find existing cart or create a new one for the user
    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser_UserId(user.getUserId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @Transactional
    public CartResponse addToCart(User user, CartItemRequest request) {
        Cart cart = getOrCreateCart(user);
        
        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Product Variant not found"));

        // Check if item is already in cart
        CartItem cartItem = cartItemRepository.findByCartAndVariant(cart, variant)
                .map(item -> {
                    item.setQuantity(item.getQuantity() + request.getQuantity());
                    return item;
                })
                .orElse(CartItem.builder()
                        .cart(cart)
                        .variant(variant)
                        .quantity(request.getQuantity())
                        .build());

        cartItemRepository.save(cartItem);
        return getCart(user);
    }

    public CartResponse getCart(User user) {
        Cart cart = getOrCreateCart(user);
        List<CartItem> items = cartItemRepository.findByCart(cart);
        
        List<CartResponse.CartItemDetail> details = items.stream().map(item -> {
            BigDecimal unitPrice = item.getVariant().getProduct().getPrice()
                    .add(item.getVariant().getPriceAdjustment());
            
            return CartResponse.CartItemDetail.builder()
                    .cartItemId(item.getCartItemId())
                    .variantId(item.getVariant().getVariantId())
                    .productName(item.getVariant().getProduct().getName())
                    .sizeOrColor(item.getVariant().getSizeOrColor())
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .subTotal(unitPrice.multiply(new BigDecimal(item.getQuantity())))
                    .build();
        }).collect(Collectors.toList());

        BigDecimal total = details.stream()
                .map(CartResponse.CartItemDetail::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .items(details)
                .cartTotal(total)
                .build();
    }

    @Transactional
    public void removeFromCart(User user, Long cartItemId) {
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        // Security check: Ensure the item belongs to the user's cart
        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new RuntimeException("You cannot delete someone else's cart item");
        }
        
        cartItemRepository.delete(item);
    }

    @Transactional
    public CartResponse updateQuantity(User user, Long cartItemId, int quantity) {
        if (quantity <= 0) {
            removeFromCart(user, cartItemId);
            return getCart(user);
        }

        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new RuntimeException("You cannot update someone else's cart item");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
        return getCart(user);
    }
}
