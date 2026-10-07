package com.jyotisales.dto;

import jakarta.validation.constraints.NotNull;

public record PaymentVerifyRequest(
        @NotNull Long paymentId,
        @NotNull String providerReference
) {}
