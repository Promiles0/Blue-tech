package com.ecom.Backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@SuppressWarnings("all")
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        if (registry == null) return;
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173") // Allow React and Vite defaults
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path path = Paths.get(uploadDir);
        String absolutePath = path.toFile().getAbsolutePath();
        
        // This maps 'http://localhost:8080/uploads/products/xyz.jpg' to the physical file on disk
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
