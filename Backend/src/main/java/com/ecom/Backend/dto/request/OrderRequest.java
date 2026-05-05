package com.ecom.Backend.dto.request;

import lombok.Data;

@Data
public class OrderRequest {
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String phone;
    private String paymentMethod; // e.g. "COD"
}
