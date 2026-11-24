package com.jyotisales.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardAnalyticsResponse(


        List<RevenuePoint> revenueTrend,


        List<ProductStat> topProducts,


        List<StatusCount> orderStatusBreakdown,


        List<MethodCount> paymentMethodBreakdown,


        BigDecimal periodRevenue,
        long       periodOrders,
        BigDecimal avgOrderValue,


        List<TopCustomer> topCustomers
) {

    public record RevenuePoint(
            String     label,
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
