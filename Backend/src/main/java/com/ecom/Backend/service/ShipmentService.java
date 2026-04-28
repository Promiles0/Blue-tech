package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.ShipmentRequest;
import com.ecom.Backend.dto.response.ShipmentResponse;
import com.ecom.Backend.entity.Order;
import com.ecom.Backend.entity.Shipment;
import com.ecom.Backend.enums.OrderStatus;
import com.ecom.Backend.enums.ShipmentStatus;
import com.ecom.Backend.repository.OrderRepository;
import com.ecom.Backend.repository.ShipmentRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public ShipmentResponse createShipment(ShipmentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Shipment shipment = Shipment.builder()
                .order(order)
                .address(order.getAddress())
                .trackingNumber(request.getTrackingNumber())
                .carrier(request.getCarrier())
                .status(request.getStatus())
                .deliveryNotes(request.getDeliveryNotes() != null ? request.getDeliveryNotes() : order.getOrderAddressLandmarks())
                .shippedAt(LocalDateTime.now())
                .build();

        Shipment savedShipment = shipmentRepository.save(shipment);
        syncOrderStatusAndNotify(order, request.getStatus());

        auditLogService.log(
                authService.getCurrentAuthenticatedUser().getUserId(),
                "CREATE_SHIPMENT",
                "shipments",
                "Created shipment for order ID: " + order.getOrderId(),
                null
        );

        return mapToResponse(savedShipment);
    }

    @Transactional
    public ShipmentResponse updateShipmentStatus(Long shipmentId, ShipmentStatus newStatus) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        shipment.setStatus(newStatus);
        Shipment updatedShipment = shipmentRepository.save(shipment);
        syncOrderStatusAndNotify(shipment.getOrder(), newStatus);

        return mapToResponse(updatedShipment);
    }

    private void syncOrderStatusAndNotify(Order order, ShipmentStatus shipmentStatus) {
        String title = "Order Update";
        String message = "";
        
        if (shipmentStatus == ShipmentStatus.IN_TRANSIT) {
            order.setStatus(OrderStatus.SHIPPED);
            message = "Your order #" + order.getOrderId() + " has been shipped!";
        } else if (shipmentStatus == ShipmentStatus.DELIVERED) {
            order.setStatus(OrderStatus.DELIVERED);
            message = "Your order #" + order.getOrderId() + " has been delivered!";
        }

        if (!message.isEmpty()) {
            orderRepository.save(order);
            notificationService.createNotification(order.getUser(), title, message);
            emailService.sendEmail(order.getUser().getEmail(), title, message);
        }
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        return ShipmentResponse.builder()
                .shipmentId(shipment.getShipmentId())
                .orderId(shipment.getOrder().getOrderId())
                .trackingNumber(shipment.getTrackingNumber())
                .carrier(shipment.getCarrier())
                .status(shipment.getStatus())
                .deliveryNotes(shipment.getDeliveryNotes())
                .shippedAt(shipment.getShippedAt())
                .build();
    }
}

