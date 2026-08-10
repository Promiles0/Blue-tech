package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.AddressRequest;
import com.ecom.Backend.dto.response.AddressResponse;
import com.ecom.Backend.entity.Address;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.repository.AddressRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AddressService {

    private final AddressRepository addressRepository;

    @Transactional
    public AddressResponse addAddress(User user, AddressRequest request) {
        // 1. If this is the user's first address, or they marked it as default
        List<Address> existingAddresses = addressRepository.findByUser_UserId(user.getUserId());
        boolean isFirstAddress = existingAddresses.isEmpty();
        boolean shouldBeDefault = isFirstAddress || (request.getIsDefault() != null && request.getIsDefault());

        if (shouldBeDefault) {
            unsetCurrentDefault(user);
        }

        Address address = Address.builder()
                .user(user)
                .recipientName(request.getRecipientName())
                .phoneNumber(request.getPhoneNumber())
                .streetAddress(request.getStreetAddress())
                .city(request.getCity())
                .landmarks(request.getLandmarks())
                .country(request.getCountry())
                .isDefault(shouldBeDefault)
                .build();

        Address savedAddress = addressRepository.save(address);
        return mapToResponse(savedAddress);
    }

    public List<AddressResponse> listUserAddresses(User user) {
        return addressRepository.findByUser_UserId(user.getUserId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void setDefault(User user, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        
        if (!address.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Unauthorized to edit this address");
        }

        unsetCurrentDefault(user);
        address.setIsDefault(true);
        addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(User user, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Unauthorized to delete this address");
        }

        addressRepository.delete(address);
    }

    private void unsetCurrentDefault(User user) {
        List<Address> defaults = addressRepository.findByUser_UserIdAndIsDefaultTrue(user.getUserId());
        for (Address addr : defaults) {
            addr.setIsDefault(false);
            addressRepository.save(addr);
        }
    }

    private AddressResponse mapToResponse(Address address) {
        return AddressResponse.builder()
                .addressId(address.getAddressId())
                .recipientName(address.getRecipientName())
                .phoneNumber(address.getPhoneNumber())
                .streetAddress(address.getStreetAddress())
                .city(address.getCity())
                .landmarks(address.getLandmarks())
                .country(address.getCountry())
                .isDefault(address.getIsDefault())
                .build();
    }
}
