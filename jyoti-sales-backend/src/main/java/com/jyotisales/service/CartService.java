package com.jyotisales.service;

import com.jyotisales.dto.CartItemRequest;
import com.jyotisales.dto.CartResponse;
import com.jyotisales.entity.*;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CouponRepository couponRepository;

    @Transactional
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User ref = new User();
            ref.setId(userId);
            Cart cart = new Cart();
            cart.setUser(ref);
            return cartRepository.save(cart);
        });
    }

    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest req) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> ApiException.notFound("Product not found"));

        ProductVariant variant = null;
        if (req.variantId() != null) {
            variant = variantRepository.findById(req.variantId())
                    .orElseThrow(() -> ApiException.notFound("Variant not found"));
        }

        int qty = req.quantity() != null ? req.quantity() : 1;
        Long variantId = variant != null ? variant.getId() : null;

        CartItem item = cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), product.getId(), variantId)
                .orElse(null);

        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setVariant(variant);
            item.setQuantity(qty);
            cart.getItems().add(item);
        } else {
            item.setQuantity(item.getQuantity() + qty);
        }
        cartItemRepository.save(item);
        return buildResponse(cartRepository.findByUserId(userId).orElseThrow());
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long cartItemId, int quantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream().filter(i -> i.getId().equals(cartItemId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Cart item not found"));
        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return buildResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long cartItemId) {
        return updateItem(userId, cartItemId, 0);
    }

    @Transactional
    public CartResponse applyCoupon(Long userId, String code) {
        Cart cart = getOrCreateCart(userId);
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .filter(Coupon::isActive)
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired coupon"));
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(java.time.Instant.now())) {
            throw ApiException.badRequest("Coupon has expired");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw ApiException.badRequest("Coupon usage limit reached");
        }
        cart.setAppliedCouponCode(coupon.getCode());
        cartRepository.save(cart);
        return buildResponse(cart);
    }

    @Transactional
    public CartResponse removeCoupon(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cart.setAppliedCouponCode(null);
        cartRepository.save(cart);
        return buildResponse(cart);
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        return buildResponse(getOrCreateCart(userId));
    }

    private CartResponse buildResponse(Cart cart) {
        List<CartResponse.Item> items = cart.getItems().stream().map(ci -> {
            BigDecimal unitPrice = ci.getProduct().getPrice();
            String variantLabel = null;
            int stock = ci.getProduct().getStock();
            if (ci.getVariant() != null) {
                unitPrice = unitPrice.add(ci.getVariant().getPriceDelta());
                variantLabel = ci.getVariant().getVariantType() + ": " + ci.getVariant().getVariantValue();
                stock = ci.getVariant().getStock();
            }
            String imageUrl = ci.getProduct().getImages().stream().findFirst().map(ProductImage::getUrl).orElse(null);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity()));
            return new CartResponse.Item(ci.getId(), ci.getProduct().getId(), ci.getProduct().getName(), imageUrl,
                    ci.getVariant() != null ? ci.getVariant().getId() : null, variantLabel,
                    unitPrice, ci.getQuantity(), lineTotal, stock);
        }).toList();

        BigDecimal subtotal = items.stream().map(CartResponse.Item::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = BigDecimal.ZERO;

        if (cart.getAppliedCouponCode() != null) {
            var couponOpt = couponRepository.findByCodeIgnoreCase(cart.getAppliedCouponCode());
            if (couponOpt.isPresent()) {
                Coupon c = couponOpt.get();
                if (subtotal.compareTo(c.getMinOrderValue() != null ? c.getMinOrderValue() : BigDecimal.ZERO) >= 0) {
                    discount = c.getDiscountType() == Coupon.DiscountType.FLAT
                            ? c.getDiscountValue()
                            : subtotal.multiply(c.getDiscountValue()).divide(BigDecimal.valueOf(100));
                    if (discount.compareTo(subtotal) > 0) discount = subtotal;
                }
            }
        }

        BigDecimal total = subtotal.subtract(discount);
        return new CartResponse(cart.getId(), items, subtotal, discount, total, cart.getAppliedCouponCode());
    }
}
