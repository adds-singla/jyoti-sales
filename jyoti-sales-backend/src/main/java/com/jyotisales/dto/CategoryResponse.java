package com.jyotisales.dto;

import java.util.List;

public record CategoryResponse(
        Long id, String name, String slug, String bannerImageUrl,
        Integer displayOrder, Long parentId, List<CategoryResponse> subcategories
) {}
