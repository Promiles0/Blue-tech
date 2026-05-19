package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.AdminOrderDetailResponse;
import com.ecom.Backend.dto.response.AdminOrderListResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.enums.ShipmentStatus;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.*;
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
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public List<AdminOrderListResponse> listOrders(String status) {
        List<Order> orders;
        if (status != null && !status.equalsIgnoreCase("all")) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.valueOf(status.toUpperCase()));
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(this::toListResponse).collect(Collectors.toList());
    }

    public AdminOrderDetailResponse getOrderDetail(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return toDetailResponse(order);
    }

    @Transactional
    public AdminOrderDetailResponse updateStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        orderRepository.save(order);
        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        auditLogService.log(adminId, "order.status_update", "orders", String.valueOf(orderId),
                "Status updated to " + status + " for order #" + orderId, null);
        return toDetailResponse(order);
    }

    @Transactional
    public AdminOrderDetailResponse markPaid(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        PaymentRecord payment = PaymentRecord.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .status("SUCCESS")
                .paymentMethod("manual")
                .transactionReference("MANUAL-" + orderId + "-" + System.currentTimeMillis())
                .updatedAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        auditLogService.log(adminId, "order.mark_paid", "orders", String.valueOf(orderId),
                "Manually marked order #" + orderId + " as paid", null);
        return toDetailResponse(order);
    }

    @Transactional
    public AdminOrderDetailResponse createShipment(Long orderId, String carrier, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Shipment shipment = Shipment.builder()
                .order(order)
                .address(order.getAddress())
                .carrier(carrier)
                .trackingNumber(trackingNumber)
                // .status(ShipmentStatus.SHIPPED)
                .status(ShipmentStatus.IN_TRANSIT)
                .shippedAt(LocalDateTime.now())
                .build();
        shipmentRepository.save(shipment);

        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        auditLogService.log(adminId, "shipment.create", "shipments", String.valueOf(orderId),
                "Created shipment for order #" + orderId + " via " + carrier, null);
        return toDetailResponse(order);
    }

    private AdminOrderListResponse toListResponse(Order o) {
        return AdminOrderListResponse.builder()
                .orderId(o.getOrderId())
                .customerName(o.getUser() != null ? o.getUser().getName() : null)
                .customerEmail(o.getUser() != null ? o.getUser().getEmail() : null)
                .itemCount(o.getOrderItems() != null ? o.getOrderItems().size() : 0)
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .orderedAt(o.getOrderedAt())
                .build();
    }

    private AdminOrderDetailResponse toDetailResponse(Order o) {
        List<AdminOrderDetailResponse.ItemLine> items = o.getOrderItems() == null ? List.of() :
                o.getOrderItems().stream().map(oi -> {
                    BigDecimal sub = oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity()));
                    return AdminOrderDetailResponse.ItemLine.builder()
                            .productName(oi.getVariant() != null && oi.getVariant().getProduct() != null
                                    ? oi.getVariant().getProduct().getName() : "")
                            .variantInfo(oi.getVariant() != null ? oi.getVariant().getSizeOrColor() : "")
                            .quantity(oi.getQuantity())
                            .unitPrice(oi.getUnitPrice())
                            .subtotal(sub)
                            .build();
                }).collect(Collectors.toList());

        AdminOrderDetailResponse.PaymentInfo paymentInfo = paymentRepository.findByOrder_OrderId(o.getOrderId())
                .map(p -> AdminOrderDetailResponse.PaymentInfo.builder()
                        .paymentId(p.getPaymentId())
                        .status(null)
                        .amount(p.getAmount())
                        .paidAt(p.getUpdatedAt())
                        .transactionReference(p.getTransactionReference())
                        .build())
                .orElse(null);

        AdminOrderDetailResponse.ShipmentInfo shipmentInfo = shipmentRepository.findByOrder_OrderId(o.getOrderId())
                .map(s -> AdminOrderDetailResponse.ShipmentInfo.builder()
                        .shipmentId(s.getShipmentId())
                        .carrier(s.getCarrier())
                        .trackingNumber(s.getTrackingNumber())
                        .status(s.getStatus())
                        .shippedAt(s.getShippedAt())
                        .build())
                .orElse(null);

        return AdminOrderDetailResponse.builder()
                .orderId(o.getOrderId())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .orderedAt(o.getOrderedAt())
                .customerName(o.getUser() != null ? o.getUser().getName() : null)
                .customerEmail(o.getUser() != null ? o.getUser().getEmail() : null)
                .customerPhone(
                    o.getOrderAddressPhoneNumber() != null ? o.getOrderAddressPhoneNumber() :
                    o.getUser() != null ? o.getUser().getPhone() : null
                )
                .addressStreet(o.getOrderAddressStreet())
                .addressCity(o.getOrderAddressCity())
                .addressCountry(o.getOrderAddressCountry())
                .items(items)
                .payment(paymentInfo)
                .shipment(shipmentInfo)
                .build();
    }
}
