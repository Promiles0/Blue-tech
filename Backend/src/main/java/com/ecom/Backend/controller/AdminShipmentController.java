package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.ShipmentRequest;
import com.ecom.Backend.dto.response.ShipmentResponse;
import com.ecom.Backend.enums.ShipmentStatus;
import com.ecom.Backend.service.ShipmentService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/shipments")
@RequiredArgsConstructor
public class AdminShipmentController {

    private final ShipmentService shipmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<ShipmentResponse>> createShipment(@Valid @RequestBody ShipmentRequest request) {
        ShipmentResponse response = shipmentService.createShipment(request);
        return new ResponseEntity<>(
                ApiResponse.success("Shipment created successfully", response),
                HttpStatus.CREATED
        );
    }

    @PatchMapping("/{shipmentId}/status")
    public ResponseEntity<ApiResponse<ShipmentResponse>> updateStatus(
            @PathVariable Long shipmentId,
            @RequestParam ShipmentStatus status) {
        ShipmentResponse response = shipmentService.updateShipmentStatus(shipmentId, status);
        return ResponseEntity.ok(ApiResponse.success("Shipment status updated", response));
    }
}
