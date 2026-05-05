package com.ecom.Backend.dto.response;

import com.ecom.Backend.enums.ShipmentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShipmentResponse {
    private Long shipmentId;
    private Long orderId;
    private String customerEmail;
    private String carrier;
    private String trackingNumber;
    private ShipmentStatus status;
    private LocalDateTime shippedAt;
}
