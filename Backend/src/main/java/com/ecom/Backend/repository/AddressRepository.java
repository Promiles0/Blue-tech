package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser_UserId(Long userId);
    List<Address> findByUser_UserIdAndIsDefaultTrue(Long userId);
}
