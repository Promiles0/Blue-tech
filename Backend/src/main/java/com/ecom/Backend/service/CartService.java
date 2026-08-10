package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.CartItemRequest;
import com.ecom.Backend.dto.response.CartResponse;
import com.ecom.Backend.entity.Cart;
import com.ecom.Backend.entity.CartItem;
import com.ecom.Backend.entity.ProductVariant;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.enums.NotificationSeverity;
import com.ecom.Backend.repository.CartItemRepository;
import com.ecom.Backend.repository.CartRepository;
import com.ecom.Backend.repository.ProductVariantRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
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
    @Lazy
    private final NotificationService notificationService;

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
        String productName = variant.getProduct().getName();
        try {
            notificationService.emitUserNotification(user, NotificationCategory.SHOPPING,
                    NotificationSeverity.INFO,
                    productName + " added to cart",
                    "You added " + productName + " to your cart.",
                    "/cart");
        } catch (Exception ignored) {}
        return getCart(user);
    }

    public CartResponse getCart(User user) {
        Cart cart = getOrCreateCart(user);
        List<CartItem> items = cartItemRepository.findByCart(cart);

        List<CartResponse.CartItemDetail> details = items.stream().map(item -> {
            BigDecimal unitPrice = item.getVariant().getProduct().getPrice()
                    .add(item.getVariant().getPriceAdjustment() != null
                            ? item.getVariant().getPriceAdjustment()
                            : BigDecimal.ZERO);

            String imageUrl = null;
            var images = item.getVariant().getProduct().getImages();
            if (images != null && !images.isEmpty()) {
                imageUrl = images.stream()
                        .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                        .map(img -> img.getImageUrl())
                        .findFirst()
                        .orElse(images.get(0).getImageUrl());
            }

            return CartResponse.CartItemDetail.builder()
                    .cartItemId(item.getCartItemId())
                    .variantId(item.getVariant().getVariantId())
                    .productName(item.getVariant().getProduct().getName())
                    .sizeOrColor(item.getVariant().getSizeOrColor())
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .subTotal(unitPrice.multiply(new BigDecimal(item.getQuantity())))
                    .productImageUrl(imageUrl)
                    .stockQuantity(item.getVariant().getStockQuantity())
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
    public CartResponse updateQuantity(User user, Long cartItemId, int quantity) {
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new RuntimeException("You cannot update someone else's cart item");
        }

        if (quantity < 1) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return getCart(user);
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
}
