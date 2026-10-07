package com.jyotisales.service;

import com.jyotisales.dto.DashboardStatsResponse;
import com.jyotisales.entity.Order;
import com.jyotisales.entity.Product;
import com.jyotisales.repository.OrderRepository;
import com.jyotisales.repository.ProductRepository;
import com.jyotisales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private static final int LOW_STOCK_THRESHOLD = 5;

    public DashboardStatsResponse getStats() {
        List<Order> allOrders = orderRepository.findAll();
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != Order.Status.CANCELLED)
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = allOrders.size();
        long totalCustomers = userRepository.count();

        List<Product> lowStock = productRepository.findAll().stream()
                .filter(p -> p.getStock() <= LOW_STOCK_THRESHOLD)
                .toList();

        List<DashboardStatsResponse.LowStockItem> items = lowStock.stream()
                .map(p -> new DashboardStatsResponse.LowStockItem(p.getId(), p.getName(), p.getStock()))
                .toList();

        return new DashboardStatsResponse(totalRevenue, totalOrders, totalCustomers, lowStock.size(), items);
    }
}
