package com.jyotisales.service;

import com.jyotisales.dto.ProductResponse;
import com.jyotisales.entity.Product;
import com.jyotisales.entity.User;
import com.jyotisales.entity.Wishlist;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.ProductRepository;
import com.jyotisales.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<ProductResponse> list(Long userId) {
        return wishlistRepository.findByUserId(userId).stream()
                .map(Wishlist::getProduct)
                .map(productService::toResponse)
                .toList();
    }

    @Transactional
    public void add(Long userId, Long productId) {
        if (wishlistRepository.findByUserIdAndProductId(userId, productId).isPresent()) return;
        Product product = productRepository.findById(productId).orElseThrow(() -> ApiException.notFound("Product not found"));
        Wishlist w = new Wishlist();
        User ref = new User();
        ref.setId(userId);
        w.setUser(ref);
        w.setProduct(product);
        wishlistRepository.save(w);
    }

    @Transactional
    public void remove(Long userId, Long productId) {
        wishlistRepository.findByUserIdAndProductId(userId, productId).ifPresent(wishlistRepository::delete);
    }
}
