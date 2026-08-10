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
    List<Order> findByStatus(OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.orderItems oi " +
           "WHERE o.user = :user AND oi.variant.product = :product AND o.status = :status")
    boolean existsByUserAndProductAndStatus(@Param("user") User user,
                                            @Param("product") Product product,
                                            @Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != 'CANCELLED'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != 'CANCELLED' AND o.createdAt >= :from")
    BigDecimal calculateRevenueAfter(@Param("from") LocalDateTime from);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from AND o.status != 'CANCELLED'")
    Long countByCreatedAtAfterAndNotCancelled(@Param("from") LocalDateTime from);

    Long countByCreatedAtAfter(LocalDateTime dateTime);

    Long countByStatusNot(OrderStatus status);

    @Query("SELECT CAST(o.createdAt AS date), SUM(o.totalAmount) " +
           "FROM Order o " +
           "WHERE o.status != 'CANCELLED' AND o.createdAt > :dateTime " +
           "GROUP BY CAST(o.createdAt AS date) " +
           "ORDER BY CAST(o.createdAt AS date) ASC")
    List<Object[]> findRevenueByDayAfter(@Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT oi.variant.product.name, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi " +
           "GROUP BY oi.variant.product.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopSellers();

    @Query("SELECT oi.variant.product.name, SUM(oi.quantity * oi.unitPrice) as revenue " +
           "FROM OrderItem oi JOIN oi.order o WHERE o.status != 'CANCELLED' " +
           "GROUP BY oi.variant.product.name ORDER BY revenue DESC")
    List<Object[]> findTopProductsByRevenue();

    @Query("SELECT oi.variant.product.category.categoryName, SUM(oi.quantity * oi.unitPrice) as revenue " +
       "FROM OrderItem oi JOIN oi.order o WHERE o.status != 'CANCELLED' AND oi.variant.product.category IS NOT NULL " +
       "GROUP BY oi.variant.product.category.categoryName ORDER BY revenue DESC")
    List<Object[]> findRevenueByCategory();

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupedByStatus();

    List<Order> findTop5ByOrderByCreatedAtDesc();

    Long countByStatus(OrderStatus status);
}
