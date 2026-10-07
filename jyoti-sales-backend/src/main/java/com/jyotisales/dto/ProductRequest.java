package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductRequest(
        @NotBlank String name,
        @NotNull Long categoryId,
        String brand,
        String description,
        @NotBlank String sku,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull @PositiveOrZero BigDecimal mrp,
        @PositiveOrZero Integer stock,
        Map<String, String> specs,
        boolean featured,
        boolean active,
        List<String> imageUrls,
        List<VariantRequest> variants
) {
    public record VariantRequest(String variantType, String variantValue, BigDecimal priceDelta, Integer stock, String sku) {}
}
