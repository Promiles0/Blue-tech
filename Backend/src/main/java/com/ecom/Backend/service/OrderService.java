package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.enums.CouponKind;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.repository.*;
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

        // 3. Calculate Total and Prepare Order
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        // 4. Create the Order (Snapshotting Address) - but don't save yet
        Order order = Order.builder()
                .user(user)
                .address(address)
                .status(OrderStatus.PENDING)
                .orderAddressStreet(request.getStreet())
                .orderAddressCity(request.getCity())
                .orderAddressCountry(request.getCountry())
                .orderAddressPhoneNumber(request.getPhone())
                .orderAddressRecipient(user.getName())
                .totalAmount(BigDecimal.ZERO) // Set initial value to avoid null constraint
                .build();
        
        // We save the order first to get an ID
        Order savedOrder = orderRepository.save(order);

        // 5. Create Order Items and Reduce Stock Atomics
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

        // 7. Update Final Total and Save Order again
        savedOrder.setTotalAmount(totalAmount);
        orderRepository.save(savedOrder);

        // 8. Clear the User's Cart
        cartItemRepository.deleteAll(cartItems);

        // 9. LOG MUTATION
        auditLogService.log(
                user.getUserId(),
                "PLACE_ORDER",
                "orders",
                "User placed order ID: " + savedOrder.getOrderId() + " for total " + totalAmount,
                null
        );

        // 10. Send Email Confirmation
        emailService.sendOrderConfirmation(user.getEmail(), savedOrder.getOrderId().toString(), totalAmount.toString());

        return mapToOrderResponse(savedOrder);
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
        List<OrderResponse.OrderItemResponse> items = order.getOrderItems().stream().map(oi -> 
            OrderResponse.OrderItemResponse.builder()
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
