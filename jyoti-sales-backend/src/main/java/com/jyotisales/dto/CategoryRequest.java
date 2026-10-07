package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String name,
        String slug,
        String bannerImageUrl,
        Integer displayOrder,
        Long parentId
) {}
