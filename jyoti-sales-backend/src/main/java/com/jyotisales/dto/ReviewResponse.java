package com.jyotisales.dto;

import java.time.Instant;
import java.util.List;

public record ReviewResponse(
        Long id, Long productId, String userName, Integer rating,
        String title, String body, boolean verifiedPurchase,
        List<String> photoUrls, Instant createdAt
) {}
