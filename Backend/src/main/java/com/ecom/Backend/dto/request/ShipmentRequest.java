package com.ecom.Backend.dto.request;

import com.ecom.Backend.enums.ShipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentRequest {
    
    @NotNull(message = "Order ID is required")
    private Long orderId;
    
    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;
    
    @NotBlank(message = "Carrier is required")
    private String carrier;
    
    @NotNull(message = "Status is required")
    private ShipmentStatus status;
    
    private String deliveryNotes;
}
