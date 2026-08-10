package com.ecom.Backend.repository;

import com.ecom.Backend.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
    Optional<PaymentRecord> findByTransactionReference(String transactionReference);
    Optional<PaymentRecord> findByOrder_OrderId(Long orderId);
}
