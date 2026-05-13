package com.ecom.Backend.repository;

import com.ecom.Backend.entity.HeroSlide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeroSlideRepository extends JpaRepository<HeroSlide, Long> {
    List<HeroSlide> findByIsActiveTrueOrderBySortOrderAsc();
}
