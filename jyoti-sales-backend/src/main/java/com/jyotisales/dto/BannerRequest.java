package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record BannerRequest(
        @NotBlank String title,
        String subtitle,
        @NotBlank String imageUrl,
        String linkUrl,
        Integer displayOrder,
        Instant startsAt,
        Instant endsAt,
        boolean active
) {}
