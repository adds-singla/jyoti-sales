package com.jyotisales.controller;

import com.jyotisales.entity.Coupon;
import com.jyotisales.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public-facing coupon endpoints (authenticated users).
 * Returns only active, non-expired, non-exhausted coupons — safe for customer display.
 */
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/active")
    public ResponseEntity<List<Coupon>> active() {
        return ResponseEntity.ok(couponService.listActive());
    }
}
