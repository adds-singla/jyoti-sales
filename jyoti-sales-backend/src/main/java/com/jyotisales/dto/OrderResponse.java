package com.jyotisales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String status,
        List<Item> items,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shippingFee,
        BigDecimal total,
        String couponCode,
        String customerName,
        String customerEmail,
        Instant createdAt
) {
    public record Item(Long productId, String productName, Integer quantity, BigDecimal unitPrice) {}
}
