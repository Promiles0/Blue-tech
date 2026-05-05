package com.ecom.Backend.config;

import com.ecom.Backend.security.CustomOAuth2UserService;
import com.ecom.Backend.security.CustomUserDetailsService;
import com.ecom.Backend.security.JwtAuthenticationFilter;
import com.ecom.Backend.security.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CustomOAuth2UserService oauth2UserService;
    private final OAuth2AuthenticationSuccessHandler oauth2SuccessHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for REST APIs
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/login/**", "/oauth2/**", "/swagger-ui/**", "/v3/api-docs/**", "/api/payments/webhook").permitAll() // Allow everyone to access Login/Register, OAuth2, and Webhooks
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories/**", "/api/products/**", "/uploads/**", "/api/reviews/**").permitAll() // Public catalog, images, and reviews
                .requestMatchers("/api/categories/**", "/api/products/**").hasRole("ADMIN") // Only Admins can create/edit catalog
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Global admin route protection
                .requestMatchers("/api/cart/**", "/api/orders/**", "/api/wishlist/**", "/api/addresses/**", "/api/notifications/**", "/api/users/**").authenticated() // Logged in user
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/products/*/reviews").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/reviews/*").authenticated()
                .anyRequest().authenticated() // Protect everything else
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // OAuth2 needs a temporary session to store state
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(oauth2UserService))
                .successHandler(oauth2SuccessHandler)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // Inject our JWT filter before the standard filter

        return http.build();
    }
}
