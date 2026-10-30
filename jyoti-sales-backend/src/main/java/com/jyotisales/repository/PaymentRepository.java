package com.jyotisales.repository;

import com.jyotisales.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByProviderReference(String providerReference);

    @Query("SELECT p FROM Payment p WHERE p.status = 'SUCCESS' AND p.createdAt >= :from AND p.createdAt < :to")
    List<Payment> findSuccessfulInRange(@Param("from") Instant from, @Param("to") Instant to);
}
