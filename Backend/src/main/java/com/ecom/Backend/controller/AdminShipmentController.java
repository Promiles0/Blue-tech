package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.ShipmentRequest;
import com.ecom.Backend.dto.response.AdminShipmentResponse;
import com.ecom.Backend.dto.response.ShipmentResponse;
import com.ecom.Backend.entity.Shipment;
import com.ecom.Backend.enums.ShipmentStatus;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.ShipmentRepository;
import com.ecom.Backend.service.AuditLogService;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.service.ShipmentService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/shipments")
@RequiredArgsConstructor
public class AdminShipmentController {

    private final ShipmentService shipmentService;
    private final ShipmentRepository shipmentRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminShipmentResponse>>> listShipments() {
        List<AdminShipmentResponse> list = shipmentRepository.findAll().stream()
                .map(s -> AdminShipmentResponse.builder()
                        .shipmentId(s.getShipmentId())
                        .orderId(s.getOrder().getOrderId())
                        .customerEmail(s.getOrder().getUser() != null ? s.getOrder().getUser().getEmail() : null)
                        .carrier(s.getCarrier())
                        .trackingNumber(s.getTrackingNumber())
                        .status(s.getStatus())
                        .shippedAt(s.getShippedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Shipments fetched", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShipmentResponse>> createShipment(
            @Valid @RequestBody ShipmentRequest request) {
        ShipmentResponse response = shipmentService.createShipment(request);
        return new ResponseEntity<>(
                ApiResponse.success("Shipment created successfully", response),
                HttpStatus.CREATED);
    }

    @PatchMapping("/{shipmentId}")
    public ResponseEntity<ApiResponse<AdminShipmentResponse>> updateShipment(
            @PathVariable Long shipmentId,
            @RequestBody Map<String, String> body) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        if (body.containsKey("carrier"))        shipment.setCarrier(body.get("carrier"));
        if (body.containsKey("trackingNumber")) shipment.setTrackingNumber(body.get("trackingNumber"));
        if (body.containsKey("status"))         shipment.setStatus(ShipmentStatus.valueOf(body.get("status").toUpperCase()));

        shipmentRepository.save(shipment);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        auditLogService.log(adminId, "shipment.update", "shipments", String.valueOf(shipmentId),
                "Updated shipment #" + shipmentId, null);

        AdminShipmentResponse resp = AdminShipmentResponse.builder()
                .shipmentId(shipment.getShipmentId())
                .orderId(shipment.getOrder().getOrderId())
                .customerEmail(shipment.getOrder().getUser() != null ? shipment.getOrder().getUser().getEmail() : null)
                .carrier(shipment.getCarrier())
                .trackingNumber(shipment.getTrackingNumber())
                .status(shipment.getStatus())
                .shippedAt(shipment.getShippedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Shipment updated", resp));
    }

    @PatchMapping("/{shipmentId}/status")
    public ResponseEntity<ApiResponse<ShipmentResponse>> updateStatus(
            @PathVariable Long shipmentId,
            @RequestParam ShipmentStatus status) {
        ShipmentResponse response = shipmentService.updateShipmentStatus(shipmentId, status);
        return ResponseEntity.ok(ApiResponse.success("Shipment status updated", response));
    }
}
