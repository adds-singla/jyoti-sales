package com.jyotisales.dto;

import java.math.BigDecimal;

public record PaymentResponse(
        Long paymentId,
        Long orderId,
        String method,
        String status,
        BigDecimal amount,
        String provider,
        String providerReference,
        String failureReason,
        boolean testMode,
        // Razorpay-specific fields (null for dummy/COD)
        String razorpayOrderId,
        String razorpayKeyId
) {}
