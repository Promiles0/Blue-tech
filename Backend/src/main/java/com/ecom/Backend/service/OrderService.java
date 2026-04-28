package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.OrderResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.repository.*;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
    private final AuditLogService auditLogService;
    private final AuthService authService;
    private final EmailService emailService;

    @Transactional
    public OrderResponse checkout(User user) {
        // 1. Fetch Cart and Items
        Cart cart = cartRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Cart not found for user"));
        
        List<CartItem> cartItems = cartItemRepository.findByCart(cart);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cannot checkout with an empty cart");
        }

        // 2. Fetch User's Default Address
        Address address = addressRepository.findByUser_UserIdAndIsDefaultTrue(user.getUserId())
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No default shipping address found. Please add an address first."));

        // 3. Calculate Total and Prepare Order
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        // 4. Create the Order (Snapshotting Address)
        Order order = Order.builder()
                .user(user)
                .address(address)
                .status(OrderStatus.PENDING)
                .orderedAt(LocalDateTime.now())
                .orderAddressStreet(address.getStreetAddress())
                .orderAddressCity(address.getCity())
                .orderAddressCountry(address.getCountry())
                .orderAddressPhoneNumber(address.getPhoneNumber())
                .orderAddressLandmarks(address.getLandmarks())
                .orderAddressRecipient(address.getRecipientName())
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

            // SNAPSHOT PRICE: Base Price + Adjustment
            BigDecimal unitPrice = variant.getProduct().getPrice().add(variant.getPriceAdjustment());
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

        // 6. Update Final Total and Save Order again
        savedOrder.setTotalAmount(totalAmount);
        orderRepository.save(savedOrder);

        // 7. Clear the User's Cart
        cartItemRepository.deleteAll(cartItems);

        // 8. LOG MUTATION
        auditLogService.log(
                user.getUserId(),
                "PLACE_ORDER",
                "orders",
                "User placed order ID: " + savedOrder.getOrderId() + " for total " + totalAmount,
                null
        );

        // 9. Send Email Confirmation
        emailService.sendOrderConfirmation(user.getEmail(), savedOrder.getOrderId().toString(), totalAmount.toString());

        return mapToOrderResponse(savedOrder);
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

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
                authService.getCurrentAuthenticatedUser().getUserId(),
                "CANCEL_ORDER",
                "orders",
                "Cancelled order ID: " + orderId + ". Stock restored.",
                null
        );
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
