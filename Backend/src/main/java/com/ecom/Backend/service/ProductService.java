package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.*;
import com.ecom.Backend.dto.response.ProductDetailResponse;
import com.ecom.Backend.dto.response.ProductListResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.repository.*;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final FileStorageService fileStorageService; // New injection
    private final AuditLogService auditLogService;
    private final AuthService authService;

    @Transactional
    public void updateInventoryBatch(InventoryBatchUpdate request) {
        for (InventoryBatchUpdate.VariantStockUpdate update : request.getUpdates()) {
            ProductVariant variant = variantRepository.findById(update.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found with ID: " + update.getVariantId()));
            
            variant.setStockQuantity(update.getQuantity());
            variantRepository.save(variant);
        }
        
        // Log the mass update
        auditLogService.log(
                authService.getCurrentAuthenticatedUser().getUserId(),
                "BATCH_INVENTORY_UPDATE",
                "product_variants",
                "Performed batch update on " + request.getUpdates().size() + " variants.",
                null
        );
    }

    @Transactional
    public ProductDetailResponse uploadImage(Long productId, org.springframework.web.multipart.MultipartFile file, boolean isPrimary) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // 1. Store the file on disk
        String fileName = fileStorageService.storeFile(file);
        
        // 2. Build the URL (For local dev, we point to our /uploads/ route)
        String imageUrl = "/uploads/products/" + fileName;

        // 3. Save to database
        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(imageUrl)
                .isPrimary(isPrimary)
                .build();
        imageRepository.save(image);

        return buildProductDetailResponse(product, product.getVariants(), product.getImages());
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return buildProductDetailResponse(product, product.getVariants(), product.getImages());
    }

    // @Transactional acts as our Safety Bubble. If variants or images fail to save, the Product is rolled back.
    @Transactional
    public ProductDetailResponse createProduct(ProductCreateRequest request) {
        
        // 1. Find the category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        // 2. Save the Base Product
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(category)
                .build();
        Product savedProduct = productRepository.save(product);

        // 3. Save all Variants associated with this product
        List<ProductVariant> savedVariants = request.getVariants().stream().map(vReq -> {
            ProductVariant variant = ProductVariant.builder()
                    .product(savedProduct)
                    .skuCode(vReq.getSkuCode())
                    .sizeOrColor(vReq.getSizeOrColor())
                    .priceAdjustment(vReq.getPriceAdjustment())
                    .stockQuantity(vReq.getStockQuantity())
                    .build();
            return variantRepository.save(variant);
        }).collect(Collectors.toList());

        // 4. Save all Images associated with this product (if provided)
        List<ProductImage> savedImages = null;
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            savedImages = request.getImages().stream().map(iReq -> {
                ProductImage image = ProductImage.builder()
                        .product(savedProduct)
                        .imageUrl(iReq.getImageUrl())
                        .isPrimary(iReq.getIsPrimary() != null ? iReq.getIsPrimary() : false)
                        .build();
                return imageRepository.save(image);
            }).collect(Collectors.toList());
        }

        // 5. Map everything back to the massive response object
        ProductDetailResponse response = buildProductDetailResponse(savedProduct, savedVariants, savedImages);

        // 6. LOG MUTATION
        auditLogService.log(
                authService.getCurrentAuthenticatedUser().getUserId(),
                "CREATE_PRODUCT",
                "products",
                "Created product: " + savedProduct.getName() + " with price " + savedProduct.getPrice(),
                null
        );

        return response;
    }

    @Transactional
    public ProductDetailResponse updateProduct(Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // 1. Check for price change to track history
        BigDecimal oldPrice = product.getPrice();
        BigDecimal newPrice = request.getPrice();

        if (oldPrice.compareTo(newPrice) != 0) {
            PriceHistory history = PriceHistory.builder()
                    .product(product)
                    .price(oldPrice)
                    .effectiveFrom(product.getUpdatedAt() != null ? product.getUpdatedAt() : product.getCreatedAt())
                    .effectiveTo(LocalDateTime.now())
                    .build();
            priceHistoryRepository.save(history);
        }

        // 2. Update basic info
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(newPrice);

        // 3. Update Category if changed
        if (!product.getCategory().getCategoryId().equals(request.getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        Product savedProduct = productRepository.save(product);

        // 4. Log Mutation
        auditLogService.log(
                authService.getCurrentAuthenticatedUser().getUserId(),
                "UPDATE_PRODUCT",
                "products",
                "Updated product ID: " + productId + ". Price changed from " + oldPrice + " to " + newPrice,
                null
        );

        // Return current state (simplifying by using existing fetch logic or returning base info)
        return buildProductDetailResponse(savedProduct, savedProduct.getVariants(), savedProduct.getImages());
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        String productName = product.getName();
        productRepository.delete(product);

        // LOG MUTATION
        auditLogService.log(
                authService.getCurrentAuthenticatedUser().getUserId(),
                "DELETE_PRODUCT",
                "products",
                "Deleted product: " + productName,
                null
        );
    }

    // Fetches products in small "pages" (e.g., 10 at a time) to keep the app fast
    public Page<ProductListResponse> getProductsPaged(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(product -> ProductListResponse.builder()
                        .productId(product.getProductId())
                        .name(product.getName())
                        .categoryName(product.getCategory().getCategoryName())
                        .startingPrice(product.getPrice()) // Using base price for the list
                        .build());
    }

    public Page<ProductListResponse> searchProducts(String name, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.filterBy(name, categoryId, minPrice, maxPrice);
        return productRepository.findAll(spec, pageable)
                .map(product -> ProductListResponse.builder()
                        .productId(product.getProductId())
                        .name(product.getName())
                        .categoryName(product.getCategory().getCategoryName())
                        .startingPrice(product.getPrice())
                        .build());
    }

    // Helper method to convert Entities to DTOs
    private ProductDetailResponse buildProductDetailResponse(Product product, List<ProductVariant> variants, List<ProductImage> images) {
        
        List<ProductDetailResponse.VariantResponse> variantDtos = variants.stream()
                .map(v -> ProductDetailResponse.VariantResponse.builder()
                        .variantId(v.getVariantId())
                        .skuCode(v.getSkuCode())
                        .sizeOrColor(v.getSizeOrColor())
                        .priceAdjustment(v.getPriceAdjustment())
                        .stockQuantity(v.getStockQuantity())
                        .build())
                .collect(Collectors.toList());

        List<ProductDetailResponse.ImageResponse> imageDtos = images != null ? images.stream()
                .map(i -> ProductDetailResponse.ImageResponse.builder()
                        .imageId(i.getImageId())
                        .imageUrl("/uploads/products/" + i.getImageUrl())
                        .isPrimary(i.getIsPrimary())
                        .build())
                .collect(Collectors.toList()) : null;

        return ProductDetailResponse.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .categoryName(product.getCategory().getCategoryName())
                .variants(variantDtos)
                .images(imageDtos)
                .build();
    }
}
