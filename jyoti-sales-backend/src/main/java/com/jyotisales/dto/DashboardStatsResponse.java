package com.jyotisales.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsResponse(
        BigDecimal totalRevenue,
        long totalOrders,
        long totalCustomers,
        long lowStockCount,
        List<LowStockItem> lowStockItems
) {
    public record LowStockItem(Long productId, String name, Integer stock) {}
}
