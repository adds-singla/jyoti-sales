package com.jyotisales.repository;

import com.jyotisales.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(Order.Status status, Pageable pageable);
    long countByStatus(Order.Status status);

    /** All non-cancelled orders between two timestamps */
    @Query("SELECT o FROM Order o WHERE o.status <> 'CANCELLED' AND o.createdAt >= :from AND o.createdAt < :to")
    List<Order> findRevenueOrders(@Param("from") Instant from, @Param("to") Instant to);

    /** All orders (any status) between two timestamps */
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :from AND o.createdAt < :to")
    List<Order> findAllInRange(@Param("from") Instant from, @Param("to") Instant to);
}
