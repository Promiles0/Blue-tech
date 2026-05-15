package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.CartItemRequest;
import com.ecom.Backend.dto.response.CartResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.repository.CartItemRepository;
import com.ecom.Backend.repository.CartRepository;
import com.ecom.Backend.repository.ProductVariantRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock CartItemRepository cartItemRepository;
    @Mock CartRepository cartRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock NotificationService notificationService;

    @InjectMocks CartService cartService;

    private User userA;
    private User userB;
    private Cart cartA;
    private Cart cartB;
    private Product product;
    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        userA = User.builder().userId(1L).name("Alice").email("alice@example.com").build();
        userB = User.builder().userId(2L).name("Bob").email("bob@example.com").build();

        cartA = Cart.builder().cartId(10L).user(userA).build();
        cartB = Cart.builder().cartId(20L).user(userB).build();

        product = Product.builder()
                .productId(1L)
                .name("Test Shoe")
                .price(new BigDecimal("100.00"))
                .images(List.of())
                .build();

        variant = ProductVariant.builder()
                .variantId(1L)
                .product(product)
                .sizeOrColor("Red / 42")
                .priceAdjustment(new BigDecimal("10.00"))
                .stockQuantity(5)
                .build();
    }

    // --- ADD TO CART ---

    @Test
    void addToCart_newItem_success() {
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(1L);
        request.setQuantity(2);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByCartAndVariant(cartA, variant)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(cartItemRepository.findByCart(cartA)).thenReturn(List.of(
                CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(2).build()
        ));

        CartResponse response = cartService.addToCart(userA, request);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getQuantity()).isEqualTo(2);
        assertThat(response.getItems().get(0).getUnitPrice()).isEqualByComparingTo("110.00");
    }

    @Test
    void addToCart_existingItem_incrementsQuantity() {
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(1L);
        request.setQuantity(1);

        CartItem existing = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(3).build();

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByCartAndVariant(cartA, variant)).thenReturn(Optional.of(existing));
        when(cartItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(cartItemRepository.findByCart(cartA)).thenReturn(List.of(existing));

        cartService.addToCart(userA, request);

        assertThat(existing.getQuantity()).isEqualTo(4);
    }

    @Test
    void addToCart_variantNotFound_throws() {
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(99L);
        request.setQuantity(1);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(variantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.addToCart(userA, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- CART ISOLATION ---

    @Test
    void getCart_returnsOnlyCurrentUsersItems() {
        CartItem itemA = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(1).build();
        CartItem itemB = CartItem.builder().cartItemId(2L).cart(cartB).variant(variant).quantity(5).build();

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(cartItemRepository.findByCart(cartA)).thenReturn(List.of(itemA));

        when(cartRepository.findByUser_UserId(2L)).thenReturn(Optional.of(cartB));
        when(cartItemRepository.findByCart(cartB)).thenReturn(List.of(itemB));

        CartResponse responseA = cartService.getCart(userA);
        CartResponse responseB = cartService.getCart(userB);

        assertThat(responseA.getItems()).hasSize(1);
        assertThat(responseA.getItems().get(0).getQuantity()).isEqualTo(1);

        assertThat(responseB.getItems()).hasSize(1);
        assertThat(responseB.getItems().get(0).getQuantity()).isEqualTo(5);
    }

    @Test
    void getCart_nullPriceAdjustment_defaultsToZero() {
        variant.setPriceAdjustment(null);
        CartItem item = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(1).build();

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(cartItemRepository.findByCart(cartA)).thenReturn(List.of(item));

        CartResponse response = cartService.getCart(userA);

        assertThat(response.getItems().get(0).getUnitPrice()).isEqualByComparingTo("100.00");
    }

    // --- REMOVE FROM CART ---

    @Test
    void removeFromCart_wrongUser_throws() {
        CartItem itemOwnedByA = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(1).build();

        when(cartRepository.findByUser_UserId(2L)).thenReturn(Optional.of(cartB));
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(itemOwnedByA));

        assertThatThrownBy(() -> cartService.removeFromCart(userB, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("someone else");
    }

    @Test
    void removeFromCart_success() {
        CartItem item = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(1).build();

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        cartService.removeFromCart(userA, 1L);

        verify(cartItemRepository).delete(item);
    }

    // --- UPDATE QUANTITY ---

    @Test
    void updateQuantity_belowOne_deletesItem() {
        CartItem item = CartItem.builder().cartItemId(1L).cart(cartA).variant(variant).quantity(1).build();

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cartA));
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(cartItemRepository.findByCart(cartA)).thenReturn(List.of());

        cartService.updateQuantity(userA, 1L, 0);

        verify(cartItemRepository).delete(item);
    }
}
