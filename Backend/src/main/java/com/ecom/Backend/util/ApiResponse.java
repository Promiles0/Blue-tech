package com.ecom.Backend.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <E> ApiResponse<E> success(String message, E data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <E> ApiResponse<E> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static <E> ApiResponse<E> error(String message, E data) {
        return new ApiResponse<>(false, message, data);
    }

}

    
        
    

