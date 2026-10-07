package com.jyotisales.controller;

import com.jyotisales.dto.CartItemRequest;
import com.jyotisales.dto.CartResponse;
import com.jyotisales.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> get() {
        return ResponseEntity.ok(cartService.getCart(CurrentUser.id()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(@Valid @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addItem(CurrentUser.id(), req));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateItem(@PathVariable Long itemId, @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItem(CurrentUser.id(), itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(CurrentUser.id(), itemId));
    }

    @PostMapping("/coupon")
    public ResponseEntity<CartResponse> applyCoupon(@RequestParam String code) {
        return ResponseEntity.ok(cartService.applyCoupon(CurrentUser.id(), code));
    }

    @DeleteMapping("/coupon")
    public ResponseEntity<CartResponse> removeCoupon() {
        return ResponseEntity.ok(cartService.removeCoupon(CurrentUser.id()));
    }
}
