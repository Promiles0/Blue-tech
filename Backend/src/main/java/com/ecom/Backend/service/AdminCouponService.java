package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.CouponRequest;
import com.ecom.Backend.dto.response.CouponResponse;
import com.ecom.Backend.entity.Coupon;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Objects;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCouponService {

    private final CouponRepository couponRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public List<CouponResponse> listAll() {
        return couponRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CouponResponse create(CouponRequest req) {
        if (couponRepository.findByCodeIgnoreCase(req.getCode()).isPresent()) {
            throw new RuntimeException("Coupon code already exists");
        }
        Coupon coupon = Coupon.builder()
                .code(req.getCode().toUpperCase())
                .kind(req.getKind())
                .value(req.getValue())
                .minSubtotal(req.getMinSubtotal())
                .startsAt(req.getStartsAt())
                .endsAt(req.getEndsAt())
                .maxUses(req.getMaxUses())
                .isActive(req.isActive())
                .build();
        Coupon saved = Objects.requireNonNull(couponRepository.save(coupon));
        auditLogService.log(authService.getCurrentAuthenticatedUser().getUserId(),
                "CREATE_COUPON", "coupons", Objects.requireNonNull(saved.getCouponId()).toString(), "Created coupon: " + saved.getCode(), null);
        return toResponse(saved);
    }

    public CouponResponse update(Long id, CouponRequest req) {
        Coupon coupon = getOrThrow(id);
        coupon.setCode(req.getCode().toUpperCase());
        coupon.setKind(req.getKind());
        coupon.setValue(req.getValue());
        coupon.setMinSubtotal(req.getMinSubtotal());
        coupon.setStartsAt(req.getStartsAt());
        coupon.setEndsAt(req.getEndsAt());
        coupon.setMaxUses(req.getMaxUses());
        coupon.setActive(req.isActive());
        return toResponse(couponRepository.save(coupon));
    }

    public CouponResponse toggleActive(Long id) {
        Coupon coupon = getOrThrow(id);
        coupon.setActive(!coupon.isActive());
        Coupon saved = couponRepository.save(coupon);
        auditLogService.log(authService.getCurrentAuthenticatedUser().getUserId(),
                "TOGGLE_COUPON", "coupons", Objects.requireNonNull(id).toString(),
                (saved.isActive() ? "Activated" : "Paused") + " coupon: " + saved.getCode(), null);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Coupon coupon = getOrThrow(id);
        auditLogService.log(authService.getCurrentAuthenticatedUser().getUserId(),
                "DELETE_COUPON", "coupons", id.toString(), "Deleted coupon: " + coupon.getCode(), null);
        couponRepository.delete(coupon);
    }

    public CouponResponse validate(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        if (!coupon.isActive()) throw new RuntimeException("Coupon is not active");
        if (coupon.getMaxUses() != null && coupon.getUses() >= coupon.getMaxUses())
            throw new RuntimeException("Coupon usage limit reached");
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt()))
            throw new RuntimeException("Coupon is not yet valid");
        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt()))
            throw new RuntimeException("Coupon has expired");
        return toResponse(coupon);
    }

    private Coupon getOrThrow(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
    }

    private CouponResponse toResponse(Coupon c) {
        return CouponResponse.builder()
                .couponId(c.getCouponId())
                .code(c.getCode())
                .kind(c.getKind())
                .value(c.getValue())
                .minSubtotal(c.getMinSubtotal())
                .startsAt(c.getStartsAt())
                .endsAt(c.getEndsAt())
                .maxUses(c.getMaxUses())
                .uses(c.getUses())
                .isActive(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
