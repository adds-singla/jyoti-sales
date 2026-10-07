package com.jyotisales.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReviewRequest(
        @NotNull Long productId,
        @Min(1) @Max(5) Integer rating,
        String title,
        String body,
        List<String> photoUrls
) {}
