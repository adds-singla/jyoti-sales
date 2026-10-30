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

    /**
     * Loads all orders in range with items, product snapshots, and user
     * in a single JOIN FETCH query — avoids LazyInitializationException
     * and N+1 queries when the service iterates items and user fields.
     */
    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.product
        LEFT JOIN FETCH o.user
        WHERE o.createdAt >= :from AND o.createdAt < :to
        ORDER BY o.createdAt DESC
        """)
    List<Order> findAllInRange(@Param("from") Instant from, @Param("to") Instant to);
}
