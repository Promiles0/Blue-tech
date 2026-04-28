package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Long shipmentId;
    private Long orderId;
    private String trackingNumber;
    private String carrier;
    private ShipmentStatus status;
    private String deliveryNotes;
    private LocalDateTime shippedAt;
}
