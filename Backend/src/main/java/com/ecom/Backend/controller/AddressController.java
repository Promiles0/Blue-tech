package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.AddressRequest;
import com.ecom.Backend.dto.response.AddressResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.service.AddressService;
import com.ecom.Backend.service.AuthService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final AuthService authService;

    // POST /api/addresses
    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(@Valid @RequestBody AddressRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        AddressResponse response = addressService.addAddress(user, request);
        return new ResponseEntity<>(
                ApiResponse.success("Address added successfully", response),
                HttpStatus.CREATED
        );
    }

    // GET /api/addresses
    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> listAddresses() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success("Addresses fetched", addressService.listUserAddresses(user)));
    }

    // PUT /api/addresses/{id}/default
    @PutMapping("/{addressId}/default")
    public ResponseEntity<ApiResponse<String>> setDefault(@PathVariable Long addressId) {
        User user = authService.getCurrentAuthenticatedUser();
        addressService.setDefault(user, addressId);
        return ResponseEntity.ok(ApiResponse.success("Default address updated", null));
    }

    // DELETE /api/addresses/{id}
    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse<String>> deleteAddress(@PathVariable Long addressId) {
        User user = authService.getCurrentAuthenticatedUser();
        addressService.deleteAddress(user, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }
}
