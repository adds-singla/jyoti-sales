package com.jyotisales.service;

import com.jyotisales.dto.DashboardAnalyticsResponse;
import com.jyotisales.dto.DashboardAnalyticsResponse.*;
import com.jyotisales.dto.DashboardStatsResponse;
import com.jyotisales.entity.Order;
import com.jyotisales.entity.OrderItem;
import com.jyotisales.entity.Payment;
import com.jyotisales.entity.Product;
import com.jyotisales.repository.OrderRepository;
import com.jyotisales.repository.PaymentRepository;
import com.jyotisales.repository.ProductRepository;
import com.jyotisales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository   orderRepository;
    private final UserRepository    userRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;

    private static final int    LOW_STOCK_THRESHOLD = 5;
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    // ── Legacy stats (unchanged) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        List<Order> allOrders = orderRepository.findAll();
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != Order.Status.CANCELLED)
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders    = allOrders.size();
        long totalCustomers = userRepository.count();

        List<Product> lowStock = productRepository.findAll().stream()
                .filter(p -> p.getStock() <= LOW_STOCK_THRESHOLD)
                .toList();

        List<DashboardStatsResponse.LowStockItem> items = lowStock.stream()
                .map(p -> new DashboardStatsResponse.LowStockItem(p.getId(), p.getName(), p.getStock()))
                .toList();

        return new DashboardStatsResponse(totalRevenue, totalOrders, totalCustomers, lowStock.size(), items);
    }

    // ── Analytics endpoint ────────────────────────────────────────────────────

    /**
     * @Transactional is REQUIRED here — the JOIN FETCH query in the repo
     * loads items + user eagerly, but the Hibernate session must stay open
     * while we stream through associations. Without this annotation
     * accessing o.getItems() or o.getUser() would throw
     * LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getAnalytics(String period, int year, int month, int week) {
        Instant[] range = resolveDateRange(period, year, month, week);
        Instant   from  = range[0];
        Instant   to    = range[1];

        // Single DB query — items + user already JOIN FETCH-ed
        List<Order> orders  = orderRepository.findAllInRange(from, to);
        List<Order> revenue = orders.stream()
                .filter(o -> o.getStatus() != Order.Status.CANCELLED
                          && o.getStatus() != Order.Status.REFUNDED)
                .toList();

        List<RevenuePoint> trend         = buildTrend(period, revenue, year, month);
        List<ProductStat>  topProducts   = buildProductStats(revenue);
        List<StatusCount>  statusBreakdown = buildStatusBreakdown(orders);
        List<MethodCount>  methodBreakdown = buildMethodBreakdown(from, to);

        BigDecimal periodRevenue  = sumRevenue(revenue);
        long       periodOrders   = revenue.size();
        BigDecimal avgOrderValue  = periodOrders == 0 ? BigDecimal.ZERO
                : periodRevenue.divide(BigDecimal.valueOf(periodOrders), 2, RoundingMode.HALF_UP);

        List<TopCustomer> topCustomers = buildTopCustomers(revenue);

        return new DashboardAnalyticsResponse(
                trend, topProducts, statusBreakdown, methodBreakdown,
                periodRevenue, periodOrders, avgOrderValue, topCustomers);
    }

    // ── Date range ────────────────────────────────────────────────────────────

    private Instant[] resolveDateRange(String period, int year, int month, int week) {
        return switch (period) {
            case "day" -> {
                // week param reused as day-of-month
                LocalDate day = LocalDate.of(year, month > 0 ? month : LocalDate.now(IST).getMonthValue(),
                        week > 0 ? week : LocalDate.now(IST).getDayOfMonth());
                yield new Instant[]{
                        day.atStartOfDay(IST).toInstant(),
                        day.plusDays(1).atStartOfDay(IST).toInstant()
                };
            }
            case "week" -> {
                LocalDate weekStart = LocalDate.now(IST)
                        .with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, week)
                        .with(WeekFields.ISO.dayOfWeek(), 1)
                        .withYear(year);
                yield new Instant[]{
                        weekStart.atStartOfDay(IST).toInstant(),
                        weekStart.plusWeeks(1).atStartOfDay(IST).toInstant()
                };
            }
            case "month" -> {
                YearMonth ym = YearMonth.of(year, month > 0 ? month : LocalDate.now(IST).getMonthValue());
                yield new Instant[]{
                        ym.atDay(1).atStartOfDay(IST).toInstant(),
                        ym.plusMonths(1).atDay(1).atStartOfDay(IST).toInstant()
                };
            }
            case "financial_year" -> {
                // Indian FY: 1 April → 31 March
                LocalDate fyStart = LocalDate.of(year, 4, 1);
                LocalDate fyEnd   = LocalDate.of(year + 1, 4, 1);
                yield new Instant[]{
                        fyStart.atStartOfDay(IST).toInstant(),
                        fyEnd.atStartOfDay(IST).toInstant()
                };
            }
            default -> // "all_time"
                new Instant[]{Instant.EPOCH, Instant.now().plusSeconds(1)};
        };
    }

    // ── Revenue trend ─────────────────────────────────────────────────────────

    private List<RevenuePoint> buildTrend(String period, List<Order> revenue, int year, int month) {
        return switch (period) {
            case "day" -> {
                Map<Integer, List<Order>> byHour = revenue.stream()
                        .collect(Collectors.groupingBy(o -> o.getCreatedAt().atZone(IST).getHour()));
                yield buildPoints(24, h -> String.format("%02d:00", h), byHour, 0);
            }
            case "week" -> {
                Map<Integer, List<Order>> byDow = revenue.stream()
                        .collect(Collectors.groupingBy(o -> o.getCreatedAt().atZone(IST).getDayOfWeek().getValue()));
                String[] names = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
                yield buildPoints(7, i -> names[i], byDow, 1);
            }
            case "month" -> {
                int days = YearMonth.of(year, month).lengthOfMonth();
                Map<Integer, List<Order>> byDay = revenue.stream()
                        .collect(Collectors.groupingBy(o -> o.getCreatedAt().atZone(IST).getDayOfMonth()));
                yield buildPoints(days, d -> String.valueOf(d), byDay, 1);
            }
            case "financial_year" -> {
                Map<Integer, List<Order>> byMonth = revenue.stream()
                        .collect(Collectors.groupingBy(o -> o.getCreatedAt().atZone(IST).getMonthValue()));
                int[]    fyOrder  = {4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3};
                String[] fyLabels = {"Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"};
                List<RevenuePoint> pts = new ArrayList<>();
                for (int i = 0; i < 12; i++) {
                    List<Order> os = byMonth.getOrDefault(fyOrder[i], List.of());
                    pts.add(new RevenuePoint(fyLabels[i], sumRevenue(os), os.size()));
                }
                yield pts;
            }
            default -> {
                // all_time — group by "MMM yyyy", sorted chronologically
                Map<String, List<Order>> byYearMonth = revenue.stream()
                        .collect(Collectors.groupingBy(o ->
                                o.getCreatedAt().atZone(IST)
                                        .format(DateTimeFormatter.ofPattern("yyyy-MM"))));
                yield byYearMonth.entrySet().stream()
                        .sorted(Map.Entry.comparingByKey())
                        .map(e -> {
                            // Reformat key "2025-04" → "Apr 2025" for display
                            String display = YearMonth.parse(e.getKey())
                                    .format(DateTimeFormatter.ofPattern("MMM yyyy"));
                            return new RevenuePoint(display, sumRevenue(e.getValue()), e.getValue().size());
                        })
                        .collect(Collectors.toList());
            }
        };
    }

    private List<RevenuePoint> buildPoints(int count,
            java.util.function.IntFunction<String> label,
            Map<Integer, List<Order>> data, int offset) {
        List<RevenuePoint> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            List<Order> os = data.getOrDefault(i + offset, List.of());
            list.add(new RevenuePoint(label.apply(i), sumRevenue(os), os.size()));
        }
        return list;
    }

    // ── Product stats ─────────────────────────────────────────────────────────

    private List<ProductStat> buildProductStats(List<Order> revenue) {
        Map<Long, List<OrderItem>> byProduct = revenue.stream()
                .flatMap(o -> o.getItems().stream())
                .collect(Collectors.groupingBy(oi -> oi.getProduct().getId()));

        return byProduct.entrySet().stream()
                .map(e -> {
                    List<OrderItem> items = e.getValue();
                    long units = items.stream().mapToLong(OrderItem::getQuantity).sum();
                    BigDecimal rev = items.stream()
                            .map(oi -> oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal avg = units == 0 ? BigDecimal.ZERO
                            : rev.divide(BigDecimal.valueOf(units), 2, RoundingMode.HALF_UP);
                    String name = items.get(0).getProductNameSnapshot();
                    return new ProductStat(e.getKey(), name, units, rev, avg);
                })
                .sorted(Comparator.comparing(ProductStat::revenue).reversed())
                .limit(15)
                .toList();
    }

    // ── Order status breakdown ────────────────────────────────────────────────

    private List<StatusCount> buildStatusBreakdown(List<Order> orders) {
        return orders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new StatusCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(StatusCount::count).reversed())
                .toList();
    }

    // ── Payment method breakdown ──────────────────────────────────────────────

    private List<MethodCount> buildMethodBreakdown(Instant from, Instant to) {
        List<Payment> payments = paymentRepository.findSuccessfulInRange(from, to);
        return payments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getMethod() != null ? p.getMethod().name() : "UNKNOWN"))
                .entrySet().stream()
                .map(e -> {
                    BigDecimal amt = e.getValue().stream()
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new MethodCount(e.getKey(), e.getValue().size(), amt);
                })
                .sorted(Comparator.comparingLong(MethodCount::count).reversed())
                .toList();
    }

    // ── Top customers ─────────────────────────────────────────────────────────

    private List<TopCustomer> buildTopCustomers(List<Order> revenue) {
        return revenue.stream()
                .collect(Collectors.groupingBy(o -> o.getUser().getId(), Collectors.toList()))
                .entrySet().stream()
                .map(e -> {
                    List<Order> uOrders = e.getValue();
                    BigDecimal spent    = sumRevenue(uOrders);
                    String name         = uOrders.get(0).getUser().getFullName();
                    return new TopCustomer(e.getKey(), name != null ? name : "Customer", uOrders.size(), spent);
                })
                .sorted(Comparator.comparing(TopCustomer::totalSpent).reversed())
                .limit(10)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal sumRevenue(List<Order> orders) {
        return orders.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
