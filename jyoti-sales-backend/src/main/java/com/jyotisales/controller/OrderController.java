package com.jyotisales.controller;

import com.jyotisales.dto.CheckoutRequest;
import com.jyotisales.dto.OrderResponse;
import com.jyotisales.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest req) {
        return ResponseEntity.ok(orderService.checkout(CurrentUser.id(), req));
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponse>> myOrders(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderService.myOrders(CurrentUser.id(), PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getMyOrder(CurrentUser.id(), id));
    }
}
