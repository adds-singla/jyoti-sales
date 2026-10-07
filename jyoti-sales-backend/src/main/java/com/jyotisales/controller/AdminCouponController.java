package com.jyotisales.controller;

import com.jyotisales.dto.CouponRequest;
import com.jyotisales.entity.Coupon;
import com.jyotisales.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<List<Coupon>> list() {
        return ResponseEntity.ok(couponService.list());
    }

    @PostMapping
    public ResponseEntity<Coupon> create(@Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(couponService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> update(@PathVariable Long id, @Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(couponService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
