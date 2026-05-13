package com.ecom.Backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HeroSlideRequest {
    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    @NotBlank(message = "Label is required")
    private String label;

    private String altText;
    private Integer sortOrder = 0;
    private Boolean isActive = true;
}
