package com.jyotisales.controller;

import com.jyotisales.dto.ReviewRequest;
import com.jyotisales.dto.ReviewResponse;
import com.jyotisales.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> forProduct(@PathVariable Long productId,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.listForProduct(productId, PageRequest.of(page, size)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> add(@Valid @RequestBody ReviewRequest req) {
        // verifiedPurchase gating is simplified here (true if user is authenticated & has ordered the product
        // in a full implementation — left as false by default; wire to OrderItemRepository check as needed).
        return ResponseEntity.ok(reviewService.add(CurrentUser.id(), false, req));
    }
}
