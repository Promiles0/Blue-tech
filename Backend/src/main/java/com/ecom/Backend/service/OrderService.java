package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.enums.CouponKind;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.enums.ShippingMethod;
import com.ecom.Backend.enums.PaymentMethod;
import com.ecom.Backend.repository.*;
import com.ecom.Backend.service.NotificationService;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.enums.NotificationSeverity;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final ProductVariantRepository variantRepository;
    private final CouponRepository couponRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;
    private final EmailService emailService;
    private final ShipmentRepository shipmentRepository;
    private final NotificationService notificationService;

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getUserOrders(User user) {
        return orderRepository.findByUser_UserId(user.getUserId()).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse checkout(User user, com.ecom.Backend.dto.request.OrderRequest request) {
        // 1. Fetch Cart and Items
        Cart cart = cartRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Cart not found for user"));
        
        List<CartItem> cartItems = cartItemRepository.findByCart(cart);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cannot checkout with an empty cart");
        }

        // 2. Resolve Shipping Address — match on all key fields to avoid duplicates
        Address address = addressRepository.findByUser_UserId(user.getUserId())
                .stream()
                .filter(a -> a.getStreetAddress().equalsIgnoreCase(request.getStreet())
                        && a.getCity().equalsIgnoreCase(request.getCity())
                        && a.getCountry().equalsIgnoreCase(request.getCountry())
                        && (request.getZipCode() == null || request.getZipCode().isBlank() || request.getZipCode().equalsIgnoreCase(a.getZipCode())))
                .findFirst()
                .orElseGet(() -> {
                    Address newAddr = Address.builder()
                            .user(user)
                            .streetAddress(request.getStreet())
                            .city(request.getCity())
                            .state(request.getState())
                            .zipCode(request.getZipCode())
                            .country(request.getCountry())
                            .phoneNumber(request.getPhone())
                            .recipientName(user.getName())
                            .isDefault(false)
                            .build();
                    return addressRepository.save(newAddr);
                });

        // 3. Resolve shipping method and fee
        ShippingMethod shippingMethod = ShippingMethod.STANDARD;
        BigDecimal shippingFee = BigDecimal.ZERO;
        try {
            shippingMethod = ShippingMethod.valueOf(
                request.getShippingMethod() != null ? request.getShippingMethod().toUpperCase() : "STANDARD"
            );
        } catch (IllegalArgumentException ignored) {}

        if (shippingMethod == ShippingMethod.EXPRESS) {
            shippingFee = new BigDecimal("5000.00"); // RWF 5,000 for express
        }
        // STANDARD and PICKUP are free

        // Validate: CASH and CHEQUE only allowed for PICKUP
        PaymentMethod paymentMethod = PaymentMethod.CASH;
        try {
            paymentMethod = PaymentMethod.valueOf(
                request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH"
            );
        } catch (IllegalArgumentException ignored) {}

        if ((paymentMethod == PaymentMethod.CASH || paymentMethod == PaymentMethod.CHEQUE)
                && shippingMethod != ShippingMethod.PICKUP) {
            throw new RuntimeException("Cash and Cheque payments are only available for Pickup orders.");
        }

        // 4. Pre-calculate total
        BigDecimal totalAmount = BigDecimal.ZERO;

        // 4. Create the Order (Snapshotting Address)
        Order order = Order.builder()
                .user(user)
                .address(address)
                .status(OrderStatus.PENDING)
                .shippingMethod(shippingMethod)
                .paymentMethod(paymentMethod)
                .shippingFee(shippingFee)
                .orderAddressStreet(request.getStreet())
                .orderAddressCity(request.getCity())
                .orderAddressCountry(request.getCountry())
                .orderAddressPhoneNumber(request.getPhone())
                .orderAddressRecipient(user.getName())
                .totalAmount(BigDecimal.ZERO)
                .build();

        Order savedOrder = orderRepository.save(order);

        // 5. Create Order Items and Reduce Stock Atomically
        for (CartItem cartItem : cartItems) {
            ProductVariant variant = cartItem.getVariant();

            // ATOMIC STOCK CHECK & REDUCE
            int rowsUpdated = variantRepository.reduceStockAtomic(variant.getVariantId(), cartItem.getQuantity());
            if (rowsUpdated == 0) {
                throw new RuntimeException("Out of stock: " + variant.getProduct().getName() + " (" + variant.getSizeOrColor() + ")");
            }

            // SNAPSHOT PRICE: Base Price + Adjustment (null-safe)
            BigDecimal adjustment = variant.getPriceAdjustment() != null ? variant.getPriceAdjustment() : BigDecimal.ZERO;
            BigDecimal unitPrice = variant.getProduct().getPrice().add(adjustment);
            BigDecimal itemTotal = unitPrice.multiply(new BigDecimal(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .variant(variant)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .build();

            orderItemRepository.save(orderItem);
        }

        // 6. Apply coupon discount server-side if provided
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode().trim())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive()) throw new RuntimeException("Coupon is no longer active");
            if (coupon.getEndsAt() != null && coupon.getEndsAt().isBefore(LocalDateTime.now()))
                throw new RuntimeException("Coupon has expired");
            if (coupon.getStartsAt() != null && coupon.getStartsAt().isAfter(LocalDateTime.now()))
                throw new RuntimeException("Coupon is not yet valid");
            if (coupon.getMaxUses() != null && coupon.getUses() >= coupon.getMaxUses())
                throw new RuntimeException("Coupon usage limit reached");
            if (coupon.getMinSubtotal() != null && totalAmount.compareTo(coupon.getMinSubtotal()) < 0)
                throw new RuntimeException("Order subtotal does not meet the minimum required for this coupon");

            BigDecimal discount;
            if (coupon.getKind() == CouponKind.PERCENT) {
                discount = totalAmount.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                discount = coupon.getValue();
            }
            totalAmount = totalAmount.subtract(discount).max(BigDecimal.ZERO);
            coupon.setUses(coupon.getUses() + 1);
            couponRepository.save(coupon);
        }

        // 7. Add shipping fee to total
        totalAmount = totalAmount.add(shippingFee);

        // 8. Update Final Total and Save Order again
        savedOrder.setTotalAmount(totalAmount);
        orderRepository.save(savedOrder);

        // 9. Clear the User's Cart
        cartItemRepository.deleteAll(cartItems);

        // 10. LOG MUTATION
        auditLogService.log(
                user.getUserId(),
                "PLACE_ORDER",
                "orders",
                "User placed order ID: " + savedOrder.getOrderId() + " for total " + totalAmount,
                null
        );

        // 11. Send Email Confirmation
        emailService.sendOrderConfirmation(user.getEmail(), savedOrder.getOrderId().toString(), totalAmount.toString());

        // 12. Notify customer
        notificationService.emitUserNotification(user, NotificationCategory.ORDER, NotificationSeverity.SUCCESS,
                "Order Confirmed",
                "Your order #" + savedOrder.getOrderId() + " has been placed for " + totalAmount,
                "/orders/" + savedOrder.getOrderId());

        // 13. Notify admin
        notificationService.emitAdminNotification(NotificationCategory.ORDER, NotificationSeverity.INFO,
                "New Order #" + savedOrder.getOrderId(),
                user.getName() + " placed an order for $" + totalAmount,
                "/admin/orders");

        // Reload so orderItems collection is populated from DB
        Order fullOrder = orderRepository.findById(savedOrder.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found after save"));
        return mapToOrderResponse(fullOrder);
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        User currentUser = authService.getCurrentAuthenticatedUser();
        boolean isOwner = order.getUser().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Unauthorized to cancel this order.");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel an order that has already been delivered");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order is already cancelled");
        }

        // 1. Restore Stock
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getVariant();
            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
            variantRepository.save(variant);
        }

        // 2. Update Order Status
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Notify customer
        notificationService.emitUserNotification(currentUser, NotificationCategory.ORDER, NotificationSeverity.WARNING,
                "Order Cancelled",
                "Your order #" + orderId + " has been cancelled and stock has been restored.",
                "/orders/" + orderId);

        // Notify admin
        notificationService.emitAdminNotification(NotificationCategory.ORDER, NotificationSeverity.WARNING,
                "Order #" + orderId + " Cancelled",
                currentUser.getName() + " cancelled order #" + orderId,
                "/admin/orders");

        // 3. Log Audit
        auditLogService.log(
                currentUser.getUserId(),
                "CANCEL_ORDER",
                "orders",
                "Cancelled order ID: " + orderId + ". Stock restored.",
                null
        );
    }

    public List<OrderResponse> getMyOrders(User user) {
        return orderRepository.findByUser_UserId(user.getUserId())
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }
        OrderResponse response = mapToOrderResponse(order);
        shipmentRepository.findByOrder_OrderId(orderId).ifPresent(s ->
            response.setShipmentInfo(OrderResponse.ShipmentInfo.builder()
                    .carrier(s.getCarrier())
                    .trackingNumber(s.getTrackingNumber())
                    .status(s.getStatus().name())
                    .shippedAt(s.getShippedAt())
                    .build())
        );
        return response;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItem> rawItems = order.getOrderItems() != null ? order.getOrderItems() : List.of();
        List<OrderResponse.OrderItemResponse> items = rawItems.stream().map(oi ->
            OrderResponse.OrderItemResponse.builder()
                    .productId(oi.getVariant().getProduct().getProductId())
                    .productName(oi.getVariant().getProduct().getName())
                    .variantInfo(oi.getVariant().getSizeOrColor())
                    .quantity(oi.getQuantity())
                    .priceAtPurchase(oi.getUnitPrice())
                    .subtotal(oi.getUnitPrice().multiply(new BigDecimal(oi.getQuantity())))
                    .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .shippingMethod(order.getShippingMethod() != null ? order.getShippingMethod().name() : null)
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .shippingStreet(order.getOrderAddressStreet())
                .shippingCity(order.getOrderAddressCity())
                .shippingCountry(order.getOrderAddressCountry())
                .shippingPhoneNumber(order.getOrderAddressPhoneNumber())
                .shippingLandmarks(order.getOrderAddressLandmarks())
                .shippingRecipient(order.getOrderAddressRecipient())
                .items(items)
                .build();
    }
}
