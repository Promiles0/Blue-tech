package com.ecom.Backend.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferencesRequest {
    private String defaultShippingSpeed;  // STANDARD, EXPRESS, OVERNIGHT
    private String packagingPreference;   // STANDARD, ECO_FRIENDLY, GIFT
}
