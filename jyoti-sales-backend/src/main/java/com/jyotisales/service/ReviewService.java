package com.jyotisales.service;

import com.jyotisales.dto.ReviewRequest;
import com.jyotisales.dto.ReviewResponse;
import com.jyotisales.entity.*;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.OrderItemRepository;
import com.jyotisales.repository.ProductRepository;
import com.jyotisales.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> listForProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse add(Long userId, boolean verifiedPurchase, ReviewRequest req) {
        if (reviewRepository.existsByProductIdAndUserId(req.productId(), userId)) {
            throw ApiException.conflict("You have already reviewed this product");
        }
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> ApiException.notFound("Product not found"));

        Review review = new Review();
        review.setProduct(product);
        User ref = new User();
        ref.setId(userId);
        review.setUser(ref);
        review.setRating(req.rating());
        review.setTitle(req.title());
        review.setBody(req.body());
        review.setVerifiedPurchase(verifiedPurchase);
        review.setPhotoUrls(req.photoUrls() != null ? req.photoUrls() : List.of());
        review = reviewRepository.save(review);

        recalculateRating(product);
        return toResponse(review);
    }

    private void recalculateRating(Product product) {
        List<Review> all = reviewRepository.findAll().stream()
                .filter(r -> r.getProduct().getId().equals(product.getId())).toList();
        double avg = all.stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setRatingAverage(Math.round(avg * 10.0) / 10.0);
        product.setRatingCount(all.size());
        productRepository.save(product);
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(r.getId(), r.getProduct().getId(),
                r.getUser().getFullName() != null ? r.getUser().getFullName() : "Verified Buyer",
                r.getRating(), r.getTitle(), r.getBody(), r.isVerifiedPurchase(), r.getPhotoUrls(), r.getCreatedAt());
    }
}
