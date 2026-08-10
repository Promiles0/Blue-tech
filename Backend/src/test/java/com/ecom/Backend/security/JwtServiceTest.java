package com.ecom.Backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class JwtServiceTest {

    @Test
    void generateTokenShouldAcceptBase64UrlSecrets() throws Exception {
        JwtService jwtService = new JwtService();

        byte[] secretBytes = new byte[32];
        for (int i = 0; i < secretBytes.length; i++) {
            secretBytes[i] = (byte) (i * 7 + 3);
        }

        String secret = Base64.getUrlEncoder().encodeToString(secretBytes);
        secret = secret.substring(0, 10) + "-" + secret.substring(10);

        Field secretField = JwtService.class.getDeclaredField("secretKey");
        secretField.setAccessible(true);
        secretField.set(jwtService, secret);

        Field expirationField = JwtService.class.getDeclaredField("jwtExpiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtService, 86_400_000L);

        UserDetails user = User.withUsername("alice")
                .password("password")
                .authorities(List.of())
                .build();

        assertDoesNotThrow(() -> {
            String token = jwtService.generateToken(user);
            assertNotNull(token);
        });
    }
}
