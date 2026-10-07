package com.jyotisales.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "coupons")
public class Coupon extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    public enum DiscountType { FLAT, PERCENT }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(precision = 12, scale = 2)
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    private Instant expiresAt;

    private Integer usageLimit;

    private Integer usageCount = 0;

    private boolean active = true;
}
