package com.jyotisales.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "banners")
public class Banner extends BaseEntity {

    @Column(nullable = false)
    private String title;

    private String subtitle;

    @Column(nullable = false)
    private String imageUrl;

    private String linkUrl;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    private Instant startsAt;
    private Instant endsAt;

    private boolean active = true;
}
