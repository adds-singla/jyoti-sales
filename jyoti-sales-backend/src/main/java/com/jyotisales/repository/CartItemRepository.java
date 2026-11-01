package com.jyotisales.repository;

import com.jyotisales.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.id = :cartId AND ci.product.id = :productId " +
           "AND ((:variantId IS NULL AND ci.variant IS NULL) OR (ci.variant.id = :variantId))")
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(
            @Param("cartId") Long cartId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId
    );
}
