package com.jyotisales.service;

import com.jyotisales.dto.CategoryRequest;
import com.jyotisales.dto.CategoryResponse;
import com.jyotisales.entity.Category;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getTree() {
        return categoryRepository.findByParentIsNullOrderByDisplayOrderAsc().stream()
                .map(this::toResponseWithChildren).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        Category category = new Category();
        applyRequest(category, req);
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        applyRequest(category, req);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) throw ApiException.notFound("Category not found");
        categoryRepository.deleteById(id);
    }

    private void applyRequest(Category category, CategoryRequest req) {
        category.setName(req.name());
        category.setSlug(req.slug() != null && !req.slug().isBlank() ? SlugUtil.toSlug(req.slug()) : SlugUtil.toSlug(req.name()));
        category.setBannerImageUrl(req.bannerImageUrl());
        category.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
        if (req.parentId() != null) {
            Category parent = categoryRepository.findById(req.parentId())
                    .orElseThrow(() -> ApiException.notFound("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
    }

    private CategoryResponse toResponseWithChildren(Category c) {
        List<CategoryResponse> children = categoryRepository.findByParentIdOrderByDisplayOrderAsc(c.getId())
                .stream().map(this::toResponse).toList();
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getBannerImageUrl(),
                c.getDisplayOrder(), c.getParent() != null ? c.getParent().getId() : null, children);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getBannerImageUrl(),
                c.getDisplayOrder(), c.getParent() != null ? c.getParent().getId() : null, List.of());
    }
}
