package com.jyotisales.service;

import com.jyotisales.dto.CheckoutRequest;
import com.jyotisales.dto.OrderResponse;
import com.jyotisales.entity.*;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    /**
     * Creates an order from the user's current cart in PENDING status and immediately
     * decrements stock so that inventory is reserved at checkout time.
     */
    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest req) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.badRequest("Cart is empty"));
        if (cart.getItems().isEmpty()) {
            throw ApiException.badRequest("Cart is empty");
        }

        Address address = addressRepository.findById(req.addressId())
                .orElseThrow(() -> ApiException.notFound("Address not found"));
        if (!address.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Address does not belong to this user");
        }

        for (CartItem ci : cart.getItems()) {
            int available = ci.getVariant() != null ? ci.getVariant().getStock() : ci.getProduct().getStock();
            if (available < ci.getQuantity()) {
                throw ApiException.badRequest("Insufficient stock for " + ci.getProduct().getName());
            }
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        Order order = new Order();
        order.setOrderNumber("JYT" + Instant.now().toEpochMilli() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        User userRef = new User();
        userRef.setId(userId);
        order.setUser(userRef);

        Order.ShippingSnapshot snapshot = new Order.ShippingSnapshot();
        snapshot.setRecipientName(address.getRecipientName());
        snapshot.setPhone(address.getPhone());
        snapshot.setLine1(address.getLine1());
        snapshot.setLine2(address.getLine2());
        snapshot.setCity(address.getCity());
        snapshot.setState(address.getState());
        snapshot.setPincode(address.getPincode());
        order.setShippingAddress(snapshot);

        for (CartItem ci : cart.getItems()) {
            BigDecimal unitPrice = ci.getProduct().getPrice();
            if (ci.getVariant() != null) unitPrice = unitPrice.add(ci.getVariant().getPriceDelta());

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setVariant(ci.getVariant());
            oi.setProductNameSnapshot(ci.getProduct().getName());
            oi.setQuantity(ci.getQuantity());
            oi.setUnitPrice(unitPrice);
            order.getItems().add(oi);

            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())));

            // Decrement stock immediately at checkout
            if (ci.getVariant() != null) {
                ProductVariant v = ci.getVariant();
                v.setStock(Math.max(0, v.getStock() - ci.getQuantity()));
            } else {
                Product p = ci.getProduct();
                p.setStock(Math.max(0, p.getStock() - ci.getQuantity()));
                productRepository.save(p);
            }
        }

        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = req.couponCode() != null ? req.couponCode() : cart.getAppliedCouponCode();
        if (couponCode != null) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(couponCode)
                    .filter(Coupon::isActive)
                    .orElseThrow(() -> ApiException.badRequest("Invalid coupon"));
            if (subtotal.compareTo(coupon.getMinOrderValue() != null ? coupon.getMinOrderValue() : BigDecimal.ZERO) >= 0) {
                discount = coupon.getDiscountType() == Coupon.DiscountType.FLAT
                        ? coupon.getDiscountValue()
                        : subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                if (discount.compareTo(subtotal) > 0) discount = subtotal;
                order.setCouponCode(coupon.getCode());
                coupon.setUsageCount(coupon.getUsageCount() + 1);
                couponRepository.save(coupon);
            }
        }

        BigDecimal shippingFee = subtotal.subtract(discount).compareTo(BigDecimal.valueOf(999)) >= 0
                ? BigDecimal.ZERO : BigDecimal.valueOf(99);

        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setShippingFee(shippingFee);
        order.setTotal(subtotal.subtract(discount).add(shippingFee));
        order.setStatus(Order.Status.PENDING);

        order = orderRepository.save(order);

        // clear cart after order is created
        cart.getItems().clear();
        cart.setAppliedCouponCode(null);
        cartRepository.save(cart);

        return toResponse(order);
    }

    @Transactional
    public void markConfirmedAndDecrementStock(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() != Order.Status.PENDING) return; // idempotent

        // Stock is already decremented at checkout time, so just update status
        order.setStatus(Order.Status.CONFIRMED);
        orderRepository.save(order);
        emailService.sendOrderConfirmation(order);
        log.info("[ORDER CONFIRMED] {} — confirmation email dispatched.", order.getOrderNumber());
    }

    @Transactional
    public void markFailed(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (order.getStatus() == Order.Status.PENDING) {
                // Restore stock since the order failed
                for (OrderItem oi : order.getItems()) {
                    if (oi.getVariant() != null) {
                        ProductVariant v = oi.getVariant();
                        v.setStock(v.getStock() + oi.getQuantity());
                    } else {
                        Product p = oi.getProduct();
                        p.setStock(p.getStock() + oi.getQuantity());
                        productRepository.save(p);
                    }
                }
                order.setStatus(Order.Status.CANCELLED);
                orderRepository.save(order);
            }
        });
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> myOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!order.getUser().getId().equals(userId)) throw ApiException.forbidden("Not your order");
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelMyOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!order.getUser().getId().equals(userId)) throw ApiException.forbidden("Not your order");

        Order.Status current = order.getStatus();
        if (current == Order.Status.CANCELLED) throw ApiException.badRequest("Order is already cancelled");
        if (!java.util.Set.of(Order.Status.PENDING, Order.Status.CONFIRMED).contains(current)) {
            throw ApiException.badRequest("Order cannot be cancelled once it is " + current.name().toLowerCase() + ". Please contact support.");
        }

        // Restore stock
        for (OrderItem oi : order.getItems()) {
            if (oi.getVariant() != null) {
                ProductVariant v = oi.getVariant();
                v.setStock(v.getStock() + oi.getQuantity());
            } else {
                Product p = oi.getProduct();
                p.setStock(p.getStock() + oi.getQuantity());
                productRepository.save(p);
            }
        }

        order.setStatus(Order.Status.CANCELLED);
        Order saved = orderRepository.save(order);
        emailService.sendStatusUpdate(saved);
        return toResponse(saved);
    }

    // ---- admin ----

    @Transactional(readOnly = true)
    public Page<OrderResponse> adminList(Order.Status status, Pageable pageable) {
        Page<Order> page = status != null ? orderRepository.findByStatus(status, pageable) : orderRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public OrderResponse adminUpdateStatus(Long orderId, Order.Status newStatus) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Order.Status oldStatus = order.getStatus();

        // If cancelling a non-cancelled order, restore stock
        if (newStatus == Order.Status.CANCELLED && oldStatus != Order.Status.CANCELLED) {
            for (OrderItem oi : order.getItems()) {
                if (oi.getVariant() != null) {
                    ProductVariant v = oi.getVariant();
                    v.setStock(v.getStock() + oi.getQuantity());
                } else {
                    Product p = oi.getProduct();
                    p.setStock(p.getStock() + oi.getQuantity());
                    productRepository.save(p);
                }
            }
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        emailService.sendStatusUpdate(saved);
        return toResponse(saved);
    }

    public long countPending() {
        return orderRepository.countByStatus(Order.Status.PENDING);
    }

    public Order getEntity(Long orderId) {
        return orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderResponse.Item> items = o.getItems().stream()
                .map(i -> new OrderResponse.Item(i.getProduct().getId(), i.getProductNameSnapshot(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        String customerName = null;
        String customerEmail = null;
        try {
            User user = o.getUser();
            if (user != null) {
                customerName = user.getFullName();
                customerEmail = user.getEmail();
            }
        } catch (Exception ignored) {
            // lazy loading may fail for detached entities
        }
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getStatus().name(), items,
                o.getSubtotal(), o.getDiscount(), o.getShippingFee(), o.getTotal(), o.getCouponCode(),
                customerName, customerEmail, o.getCreatedAt());
    }
}
