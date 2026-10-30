package com.jyotisales.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardAnalyticsResponse(

        // ── Revenue trend (day / week / month / financial-year) ──────────────
        List<RevenuePoint> revenueTrend,

        // ── Product performance ───────────────────────────────────────────────
        List<ProductStat> topProducts,

        // ── Order status breakdown (for pie chart) ───────────────────────────
        List<StatusCount> orderStatusBreakdown,

        // ── Payment method split (for pie chart) ─────────────────────────────
        List<MethodCount> paymentMethodBreakdown,

        // ── Period summary KPIs ───────────────────────────────────────────────
        BigDecimal periodRevenue,
        long       periodOrders,
        BigDecimal avgOrderValue,

        // ── Top customers ─────────────────────────────────────────────────────
        List<TopCustomer> topCustomers
) {

    public record RevenuePoint(
            String     label,    // "Mon", "Week 42", "Oct", "FY 2024-25"
            BigDecimal revenue,
            long       orders
    ) {}

    public record ProductStat(
            Long       productId,
            String     productName,
            long       unitsSold,
            BigDecimal revenue,
            BigDecimal avgSellingPrice
    ) {}

    public record StatusCount(String status, long count) {}

    public record MethodCount(String method, long count, BigDecimal amount) {}

    public record TopCustomer(
            Long   userId,
            String name,
            long   orderCount,
            BigDecimal totalSpent
    ) {}
}
