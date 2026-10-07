package com.jyotisales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String sku,
        Long categoryId,
        String categoryName,
        String brand,
        String description,
        BigDecimal price,
        BigDecimal mrp,
        Integer discountPercent,
        Integer stock,
        Double ratingAverage,
        Integer ratingCount,
        boolean featured,
        boolean active,
        Map<String, String> specs,
        List<String> imageUrls,
        List<VariantResponse> variants,
        Instant createdAt
) {
    public record VariantResponse(Long id, String variantType, String variantValue, BigDecimal priceDelta, Integer stock, String sku) {}
}
