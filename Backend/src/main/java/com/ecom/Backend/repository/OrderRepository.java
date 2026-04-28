package com.ecom.Backend.repository;

import com.ecom.Backend.entity.Order;
import com.ecom.Backend.entity.Product;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_UserId(Long userId);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.orderItems oi " +
           "WHERE o.user = :user AND oi.variant.product = :product AND o.status = :status")
    boolean existsByUserAndProductAndStatus(@Param("user") User user, 
                                            @Param("product") Product product, 
                                            @Param("status") OrderStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status != 'CANCELLED'")
    BigDecimal calculateTotalRevenue();

    Long countByOrderedAtAfter(LocalDateTime dateTime);

    @Query("SELECT oi.variant.product.name, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi " +
           "GROUP BY oi.variant.product.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopSellers();
}
