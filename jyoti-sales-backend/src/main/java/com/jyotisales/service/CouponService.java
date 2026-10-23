package com.jyotisales.service;

import com.jyotisales.dto.CouponRequest;
import com.jyotisales.entity.Coupon;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public List<Coupon> list() {
        return couponRepository.findAll();
    }

    /** Returns coupons that are active, not expired, and not exhausted — safe for public display. */
    public List<Coupon> listActive() {
        java.time.Instant now = java.time.Instant.now();
        return couponRepository.findAll().stream()
                .filter(c -> c.isActive())
                .filter(c -> c.getExpiresAt() == null || c.getExpiresAt().isAfter(now))
                .filter(c -> c.getUsageLimit() == null || c.getUsageCount() < c.getUsageLimit())
                .toList();
    }

    @Transactional
    public Coupon create(CouponRequest req) {
        if (couponRepository.findByCodeIgnoreCase(req.code()).isPresent()) {
            throw ApiException.conflict("Coupon code already exists");
        }
        Coupon coupon = new Coupon();
        apply(coupon, req);
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon update(Long id, CouponRequest req) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        apply(coupon, req);
        return couponRepository.save(coupon);
    }

    @Transactional
    public void delete(Long id) {
        if (!couponRepository.existsById(id)) throw ApiException.notFound("Coupon not found");
        couponRepository.deleteById(id);
    }

    private void apply(Coupon c, CouponRequest req) {
        c.setCode(req.code().toUpperCase());
        c.setDiscountType(Coupon.DiscountType.valueOf(req.discountType().toUpperCase()));
        c.setDiscountValue(req.discountValue());
        c.setMinOrderValue(req.minOrderValue());
        c.setExpiresAt(req.expiresAt());
        c.setUsageLimit(req.usageLimit());
        c.setActive(req.active());
    }
}
