package com.ecom.Backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private Long addressId;
    private String recipientName;
    private String phoneNumber;
    private String streetAddress;
    private String city;
    private String landmarks;
    private String country;
    private Boolean isDefault;
}
