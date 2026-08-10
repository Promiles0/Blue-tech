package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.CouponRequest;
import com.ecom.Backend.dto.response.CouponResponse;
import com.ecom.Backend.service.AdminCouponService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final AdminCouponService adminCouponService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success("Coupons fetched", adminCouponService.listAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> create(@Valid @RequestBody CouponRequest req) {
        return new ResponseEntity<>(ApiResponse.success("Coupon created", adminCouponService.create(req)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> update(@PathVariable Long id, @Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", adminCouponService.update(id, req)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<CouponResponse>> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Coupon toggled", adminCouponService.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminCouponService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted", null));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<CouponResponse>> validate(@RequestParam String code) {
        return ResponseEntity.ok(ApiResponse.success("Coupon valid", adminCouponService.validate(code)));
    }
}
