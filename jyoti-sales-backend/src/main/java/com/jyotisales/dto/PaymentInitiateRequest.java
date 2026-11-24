package com.jyotisales.dto;

import jakarta.validation.constraints.NotNull;

public record PaymentInitiateRequest(
        @NotNull Long orderId,
        @NotNull String method,
        String cardNumber,
        String cardExpiry,
        String cardCvv,
        String upiId,
        String bankCode
) {}
