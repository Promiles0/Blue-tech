package com.ecom.Backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequest {
    
    @NotBlank(message = "Recipient name is required")
    private String recipientName;
    
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    
    @NotBlank(message = "Street address is required")
    private String streetAddress;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private String landmarks;
    
    @NotBlank(message = "Country is required")
    private String country;
    
    private Boolean isDefault = false;
}
