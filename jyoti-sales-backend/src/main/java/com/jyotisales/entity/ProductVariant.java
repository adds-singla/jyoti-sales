package com.jyotisales.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // e.g. "Color", "Capacity", "Size"
    @Column(nullable = false)
    private String variantType;

    // e.g. "Midnight Black", "1.5 Ton", "55 inch"
    @Column(nullable = false)
    private String variantValue;

    private BigDecimal priceDelta = BigDecimal.ZERO;

    private Integer stock = 0;

    private String sku;
}
