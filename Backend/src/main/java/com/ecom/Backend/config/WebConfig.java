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

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        if (registry == null) return;
        // allowedOriginPatterns("*") + allowCredentials(true) let ANY website read
        // credentialed responses from this API — an explicit allowlist is required
        // once credentials are involved (mirrors the Supabase edge function's CORS list).
        registry.addMapping("/**")
                .allowedOrigins(frontendUrl, "http://localhost:5173", "http://localhost:5174")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use toUri() so the location is a valid file URI on both Windows and Unix
        // (avoids backslash vs forward-slash issues on Windows paths)
        String location = Paths.get(uploadDir).resolve("products").toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) location += "/";

        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(location);
    }
}
