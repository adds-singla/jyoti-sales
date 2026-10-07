package com.jyotisales.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Long cartId,
        List<Item> items,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal total,
        String appliedCouponCode
) {
    public record Item(Long cartItemId, Long productId, String productName, String imageUrl,
                        Long variantId, String variantLabel, BigDecimal unitPrice, Integer quantity,
                        BigDecimal lineTotal, Integer availableStock) {}
}
