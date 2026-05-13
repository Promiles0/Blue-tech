package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.HeroSlideRequest;
import com.ecom.Backend.entity.HeroSlide;
import com.ecom.Backend.repository.HeroSlideRepository;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SuppressWarnings("all")
public class HeroSlideController {

    private final HeroSlideRepository heroSlideRepository;

    // Public — homepage carousel
    @GetMapping("/api/hero-slides")
    public ResponseEntity<ApiResponse<List<HeroSlide>>> getActiveSlides() {
        return ResponseEntity.ok(ApiResponse.success("Slides fetched",
                heroSlideRepository.findByIsActiveTrueOrderBySortOrderAsc()));
    }

    // Admin — full list including inactive
    @GetMapping("/api/admin/hero-slides")
    public ResponseEntity<ApiResponse<List<HeroSlide>>> getAllSlides() {
        return ResponseEntity.ok(ApiResponse.success("All slides fetched",
                heroSlideRepository.findAll()));
    }

    @PostMapping("/api/admin/hero-slides")
    public ResponseEntity<ApiResponse<HeroSlide>> createSlide(@Valid @RequestBody HeroSlideRequest req) {
        HeroSlide slide = HeroSlide.builder()
                .imageUrl(req.getImageUrl())
                .label(req.getLabel())
                .altText(req.getAltText())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();
        return new ResponseEntity<>(ApiResponse.success("Slide created", heroSlideRepository.save(slide)),
                HttpStatus.CREATED);
    }

    @PutMapping("/api/admin/hero-slides/{id}")
    public ResponseEntity<ApiResponse<HeroSlide>> updateSlide(@PathVariable Long id,
                                                               @Valid @RequestBody HeroSlideRequest req) {
        HeroSlide slide = heroSlideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Slide not found"));
        slide.setImageUrl(req.getImageUrl());
        slide.setLabel(req.getLabel());
        slide.setAltText(req.getAltText());
        if (req.getSortOrder() != null) slide.setSortOrder(req.getSortOrder());
        if (req.getIsActive() != null) slide.setActive(req.getIsActive());
        return ResponseEntity.ok(ApiResponse.success("Slide updated", heroSlideRepository.save(slide)));
    }

    @DeleteMapping("/api/admin/hero-slides/{id}")
    public ResponseEntity<ApiResponse<String>> deleteSlide(@PathVariable Long id) {
        heroSlideRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Slide deleted", null));
    }
}
