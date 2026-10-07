package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record CouponRequest(
        @NotBlank String code,
        @NotNull String discountType, // FLAT | PERCENT
        @NotNull BigDecimal discountValue,
        BigDecimal minOrderValue,
        Instant expiresAt,
        Integer usageLimit,
        boolean active
) {}
