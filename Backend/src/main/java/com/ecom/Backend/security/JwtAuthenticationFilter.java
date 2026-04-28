package com.ecom.Backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@SuppressWarnings("all")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @jakarta.annotation.Nonnull HttpServletRequest request,
            @jakarta.annotation.Nonnull HttpServletResponse response,
            @jakarta.annotation.Nonnull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Check if the Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract the token
        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            // Invalid token, continue filter chain (will result in 401 Unauthorized
            // eventually)
            filterChain.doFilter(request, response);
            return;
        }

        // 3. If we have a userEmail, and the user is NOT already authenticated in the
        // SecurityContext
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load user from database
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 4. Validate the token
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // Token is valid! Create the authentication token for Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());

                // Add IP address and session ID details to the auth token
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Finally, set the user as authenticated in the Security Context
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 5. Continue the filter chain
        filterChain.doFilter(request, response);
    }
}
