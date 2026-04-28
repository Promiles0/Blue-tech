package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.WishlistResponse;
import com.ecom.Backend.entity.*;
import com.ecom.Backend.repository.ProductRepository;
import com.ecom.Backend.repository.WishlistItemRepository;
import com.ecom.Backend.repository.WishlistRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;

    private Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUser_UserId(user.getUserId())
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder().user(user).build()));
    }

    @Transactional
    public void toggleWishlist(User user, Long productId) {
        Wishlist wishlist = getOrCreateWishlist(user);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        wishlistItemRepository.findByWishlistAndProduct(wishlist, product)
                .ifPresentOrElse(
                    wishlistItemRepository::delete,
                    () -> wishlistItemRepository.save(WishlistItem.builder()
                            .wishlist(wishlist)
                            .product(product)
                            .build())
                );
    }

    public WishlistResponse getWishlist(User user) {
        Wishlist wishlist = getOrCreateWishlist(user);
        
        List<WishlistResponse.WishlistItemDetail> items = wishlist.getItems().stream().map(item -> {
            Product p = item.getProduct();
            String primaryImage = p.getImages() != null ? p.getImages().stream()
                    .filter(ProductImage::getIsPrimary)
                    .map(ProductImage::getImageUrl)
                    .findFirst().orElse(null) : null;

            return WishlistResponse.WishlistItemDetail.builder()
                    .productId(p.getProductId())
                    .productName(p.getName())
                    .averageRating(p.getAverageRating())
                    .primaryImageUrl(primaryImage)
                    .build();
        }).collect(Collectors.toList());

        return WishlistResponse.builder().items(items).build();
    }
}

