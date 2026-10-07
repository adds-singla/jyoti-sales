package com.jyotisales.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CartItemRequest(
        @NotNull Long productId,
        Long variantId,
        @Positive Integer quantity
) {}
