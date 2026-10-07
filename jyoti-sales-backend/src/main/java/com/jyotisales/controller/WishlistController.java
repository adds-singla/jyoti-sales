package com.jyotisales.controller;

import com.jyotisales.dto.ProductResponse;
import com.jyotisales.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> list() {
        return ResponseEntity.ok(wishlistService.list(CurrentUser.id()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<Void> add(@PathVariable Long productId) {
        wishlistService.add(CurrentUser.id(), productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(@PathVariable Long productId) {
        wishlistService.remove(CurrentUser.id(), productId);
        return ResponseEntity.noContent().build();
    }
}
