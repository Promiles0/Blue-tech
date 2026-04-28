package com.ecom.Backend.controller;

import com.ecom.Backend.dto.request.*;
import com.ecom.Backend.dto.response.ProductDetailResponse;
import com.ecom.Backend.dto.response.ProductListResponse;
import com.ecom.Backend.service.ProductService;
import com.ecom.Backend.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // PUT /api/products/inventory
    @PutMapping("/inventory")
    public ResponseEntity<ApiResponse<Void>> updateInventoryBatch(@Valid @RequestBody InventoryBatchUpdate request) {
        productService.updateInventoryBatch(request);
        return ResponseEntity.ok(ApiResponse.success("Inventory updated successfully", null));
    }

    // POST /api/products/{id}/images
    @PostMapping("/{productId}/images")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> uploadImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") boolean isPrimary) {
        
        ProductDetailResponse response = productService.uploadImage(productId, file, isPrimary);
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", response));
    }

    // POST /api/products
    // Only Admin can access this (configured in SecurityConfig)
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDetailResponse>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductDetailResponse createdProduct = productService.createProduct(request);
        return new ResponseEntity<>(
                ApiResponse.success("Product created successfully", createdProduct),
                HttpStatus.CREATED
        );
    }

    // PUT /api/products/{id}
    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody ProductUpdateRequest request) {
        ProductDetailResponse updatedProduct = productService.updateProduct(productId, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", updatedProduct));
    }

    // DELETE /api/products/{id}
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    // GET /api/products/search?name=shirt&categoryId=1&minPrice=1000&maxPrice=5000
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductListResponse>>> searchProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ProductListResponse> products = productService.searchProducts(name, categoryId, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched", products));
    }

    // GET /api/products?page=0&size=10
    // Public endpoint for customers to browse the catalog
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductListResponse>>> getAllProducts(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ProductListResponse> products = productService.getProductsPaged(pageable);
        return ResponseEntity.ok(ApiResponse.success("Products fetched successfully", products));
    }
}
