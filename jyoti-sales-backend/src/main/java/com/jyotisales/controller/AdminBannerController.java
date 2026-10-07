package com.jyotisales.controller;

import com.jyotisales.dto.BannerRequest;
import com.jyotisales.entity.Banner;
import com.jyotisales.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<Banner>> list() {
        return ResponseEntity.ok(bannerService.allBanners());
    }

    @PostMapping
    public ResponseEntity<Banner> create(@Valid @RequestBody BannerRequest req) {
        return ResponseEntity.ok(bannerService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Banner> update(@PathVariable Long id, @Valid @RequestBody BannerRequest req) {
        return ResponseEntity.ok(bannerService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bannerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
