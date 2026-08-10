package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.OrderRequest;
import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.enums.CouponKind;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.repository.*;
import com.ecom.Backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock CartItemRepository cartItemRepository;
    @Mock CartRepository cartRepository;
    @Mock AddressRepository addressRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock CouponRepository couponRepository;
    @Mock AuditLogService auditLogService;
    @Mock AuthService authService;
    @Mock EmailService emailService;
    @Mock ShipmentRepository shipmentRepository;

    @InjectMocks OrderService orderService;

    private User user;
    private Cart cart;
    private Product product;
    private ProductVariant variant;
    private CartItem cartItem;
    private OrderRequest request;

    @BeforeEach
    void setUp() {
        user = User.builder().userId(1L).name("Alice").email("alice@example.com").role(RoleType.CUSTOMER).build();

        product = Product.builder()
                .productId(1L)
                .name("Test Shoe")
                .price(new BigDecimal("100.00"))
                .build();

        variant = ProductVariant.builder()
                .variantId(1L)
                .product(product)
                .sizeOrColor("Red / 42")
                .priceAdjustment(new BigDecimal("10.00"))
                .stockQuantity(5)
                .build();

        cart = Cart.builder().cartId(1L).user(user).build();
        cartItem = CartItem.builder().cartItemId(1L).cart(cart).variant(variant).quantity(2).build();

        request = new OrderRequest();
        request.setStreet("123 Main St");
        request.setCity("Kigali");
        request.setState("Gasabo");
        request.setZipCode("00100");
        request.setCountry("Rwanda");
        request.setPhone("+250780000000");
        request.setPaymentMethod("COD");
    }

    private Address mockCheckoutBase() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of(cartItem));
        when(addressRepository.findByUser_UserId(1L)).thenReturn(List.of());
        Address savedAddress = Address.builder().addressId(1L).user(user)
                .streetAddress("123 Main St").city("Kigali").country("Rwanda")
                .zipCode("00100").phoneNumber("+250780000000").recipientName("Alice").isDefault(false).build();
        when(addressRepository.save(any())).thenReturn(savedAddress);
        when(variantRepository.reduceStockAtomic(1L, 2)).thenReturn(1);
        Order savedOrder = Order.builder().orderId(1L).user(user).address(savedAddress)
                .status(OrderStatus.PENDING).orderItems(List.of()).build();
        when(orderRepository.save(any())).thenReturn(savedOrder);
        return savedAddress;
    }

    private void mockCheckoutFull() {
        mockCheckoutBase();
        doNothing().when(auditLogService).log(any(), any(), any(), any(), any());
        doNothing().when(emailService).sendOrderConfirmation(any(), any(), any());
    }

    // --- CHECKOUT ---

    @Test
    void checkout_success_calculatesCorrectTotal() {
        mockCheckoutFull();

        OrderResponse response = orderService.checkout(user, request);

        assertThat(response).isNotNull();
        // total = (100 + 10) * 2 = 220
        verify(orderRepository, times(2)).save(any(Order.class));
        verify(cartItemRepository).deleteAll(List.of(cartItem));
    }

    @Test
    void checkout_nullPriceAdjustment_doesNotThrow() {
        variant.setPriceAdjustment(null);
        mockCheckoutFull();

        // Should not throw NullPointerException
        assertThatCode(() -> orderService.checkout(user, request))
                .doesNotThrowAnyException();
    }

    @Test
    void checkout_emptyCart_throws() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of());

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("empty cart");
    }

    @Test
    void checkout_outOfStock_throws() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of(cartItem));
        when(addressRepository.findByUser_UserId(1L)).thenReturn(List.of());
        Address savedAddress = Address.builder().addressId(1L).user(user)
                .streetAddress("123 Main St").city("Kigali").country("Rwanda")
                .zipCode("00100").phoneNumber("+250780000000").recipientName("Alice").isDefault(false).build();
        when(addressRepository.save(any())).thenReturn(savedAddress);
        Order savedOrder = Order.builder().orderId(1L).user(user).address(savedAddress)
                .status(OrderStatus.PENDING).orderItems(List.of()).build();
        when(orderRepository.save(any())).thenReturn(savedOrder);
        when(variantRepository.reduceStockAtomic(1L, 2)).thenReturn(0); // out of stock

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Out of stock");
    }

    @Test
    void checkout_cartNotFound_throws() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cart not found");
    }

    // --- COUPON ---

    @Test
    void checkout_percentCoupon_appliesDiscount() {
        request.setCouponCode("SAVE10");
        mockCheckoutFull();

        Coupon coupon = Coupon.builder()
                .couponId(1L).code("SAVE10").kind(CouponKind.PERCENT)
                .value(new BigDecimal("10")).isActive(true).uses(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any())).thenReturn(coupon);

        orderService.checkout(user, request);

        // coupon uses incremented
        assertThat(coupon.getUses()).isEqualTo(1);
        verify(couponRepository).save(coupon);
    }

    @Test
    void checkout_flatCoupon_appliesDiscount() {
        request.setCouponCode("FLAT20");
        mockCheckoutFull();

        Coupon coupon = Coupon.builder()
                .couponId(2L).code("FLAT20").kind(CouponKind.FIXED)
                .value(new BigDecimal("20")).isActive(true).uses(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("FLAT20")).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any())).thenReturn(coupon);

        orderService.checkout(user, request);

        assertThat(coupon.getUses()).isEqualTo(1);
    }

    @Test
    void checkout_invalidCouponCode_throws() {
        request.setCouponCode("FAKE");
        mockCheckoutBase();

        when(couponRepository.findByCodeIgnoreCase("FAKE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid coupon");
    }

    @Test
    void checkout_expiredCoupon_throws() {
        request.setCouponCode("OLD");
        mockCheckoutBase();

        Coupon coupon = Coupon.builder()
                .couponId(3L).code("OLD").kind(CouponKind.FIXED)
                .value(new BigDecimal("10")).isActive(true).uses(0)
                .endsAt(LocalDateTime.now().minusDays(1))
                .build();
        when(couponRepository.findByCodeIgnoreCase("OLD")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void checkout_inactiveCoupon_throws() {
        request.setCouponCode("OFF");
        mockCheckoutBase();

        Coupon coupon = Coupon.builder()
                .couponId(4L).code("OFF").kind(CouponKind.FIXED)
                .value(new BigDecimal("10")).isActive(false).uses(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("OFF")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no longer active");
    }

    @Test
    void checkout_maxUsesReached_throws() {
        request.setCouponCode("MAXED");
        mockCheckoutBase();

        Coupon coupon = Coupon.builder()
                .couponId(5L).code("MAXED").kind(CouponKind.FIXED)
                .value(new BigDecimal("10")).isActive(true).uses(100).maxUses(100)
                .build();
        when(couponRepository.findByCodeIgnoreCase("MAXED")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> orderService.checkout(user, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("usage limit");
    }

    // --- CANCEL ORDER ---

    @Test
    void cancelOrder_owner_restoresStock() {
        OrderItem orderItem = OrderItem.builder().variant(variant).quantity(2).unitPrice(new BigDecimal("110")).build();
        Order order = Order.builder().orderId(1L).user(user).status(OrderStatus.PENDING)
                .orderItems(List.of(orderItem)).build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(user);
        when(variantRepository.save(any())).thenReturn(variant);
        doNothing().when(auditLogService).log(any(), any(), any(), any(), any());

        orderService.cancelOrder(1L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(variant.getStockQuantity()).isEqualTo(7); // 5 + 2 restored
    }

    @Test
    void cancelOrder_alreadyDelivered_throws() {
        Order order = Order.builder().orderId(1L).user(user).status(OrderStatus.DELIVERED)
                .orderItems(List.of()).build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(user);

        assertThatThrownBy(() -> orderService.cancelOrder(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already been delivered");
    }

    @Test
    void cancelOrder_unauthorizedUser_throws() {
        User otherUser = User.builder().userId(99L).role(RoleType.CUSTOMER).build();
        Order order = Order.builder().orderId(1L).user(user).status(OrderStatus.PENDING)
                .orderItems(List.of()).build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(otherUser);

        assertThatThrownBy(() -> orderService.cancelOrder(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    @Test
    void getOrderById_wrongUser_throws() {
        User otherUser = User.builder().userId(99L).role(RoleType.CUSTOMER).build();
        Order order = Order.builder().orderId(1L).user(user).status(OrderStatus.PENDING)
                .orderItems(List.of()).build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrderById(otherUser, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    @Test
    void getOrderById_notFound_throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(user, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
