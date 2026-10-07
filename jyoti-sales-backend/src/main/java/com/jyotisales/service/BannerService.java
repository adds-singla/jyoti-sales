package com.jyotisales.service;

import com.jyotisales.dto.BannerRequest;
import com.jyotisales.entity.Banner;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    public List<Banner> activeBanners() {
        return bannerRepository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    public List<Banner> allBanners() {
        return bannerRepository.findAll();
    }

    @Transactional
    public Banner create(BannerRequest req) {
        Banner banner = new Banner();
        apply(banner, req);
        return bannerRepository.save(banner);
    }

    @Transactional
    public Banner update(Long id, BannerRequest req) {
        Banner banner = bannerRepository.findById(id).orElseThrow(() -> ApiException.notFound("Banner not found"));
        apply(banner, req);
        return bannerRepository.save(banner);
    }

    @Transactional
    public void delete(Long id) {
        if (!bannerRepository.existsById(id)) throw ApiException.notFound("Banner not found");
        bannerRepository.deleteById(id);
    }

    private void apply(Banner b, BannerRequest req) {
        b.setTitle(req.title());
        b.setSubtitle(req.subtitle());
        b.setImageUrl(req.imageUrl());
        b.setLinkUrl(req.linkUrl());
        b.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
        b.setStartsAt(req.startsAt());
        b.setEndsAt(req.endsAt());
        b.setActive(req.active());
    }
}
