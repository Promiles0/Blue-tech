package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.CategoryRequest;
import com.ecom.Backend.dto.response.CategoryResponse;
import com.ecom.Backend.entity.Category;
import com.ecom.Backend.repository.CategoryRepository;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // Creates a new Category in the database
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .categoryName(request.getName())
                .description(request.getDescription())
                .build();

        Category savedCategory = categoryRepository.save(category);

        return mapToResponse(savedCategory);
    }

    // Fetches all categories for the frontend to display in a dropdown
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        category.setCategoryName(request.getName());
        category.setDescription(request.getDescription());
        return mapToResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
    }

    // Helper method to convert an Entity to a Response DTO
    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .name(category.getCategoryName())
                .description(category.getDescription())
                .build();
    }
}
