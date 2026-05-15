package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.UserLoginRequest;
import com.ecom.Backend.dto.request.UserRegisterRequest;
import com.ecom.Backend.dto.response.AuthResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.repository.UserRepository;
import com.ecom.Backend.security.CustomUserDetailsService;
import com.ecom.Backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock EmailService emailService;

    @InjectMocks AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .userId(1L)
                .name("John Doe")
                .email("john@example.com")
                .passwordHash("hashed_password")
                .role(RoleType.CUSTOMER)
                .build();
    }

    @Test
    void register_success() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        UserDetails mockDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("john@example.com")).thenReturn(mockDetails);
        when(jwtService.generateToken(mockDetails)).thenReturn("jwt_token");
        doNothing().when(emailService).sendEmail(anyString(), anyString(), anyString());

        AuthResponse response = authService.registerUser(request);

        assertThat(response.getToken()).isEqualTo("jwt_token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void register_duplicateEmail_throws() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setEmail("john@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerUser(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    void login_success() {
        UserLoginRequest request = new UserLoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        UserDetails mockDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("john@example.com")).thenReturn(mockDetails);
        when(jwtService.generateToken(mockDetails)).thenReturn("jwt_token");

        AuthResponse response = authService.loginUser(request);

        assertThat(response.getToken()).isEqualTo("jwt_token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_badCredentials_throws() {
        UserLoginRequest request = new UserLoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("wrong");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.loginUser(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_userNotFound_throws() {
        UserLoginRequest request = new UserLoginRequest();
        request.setEmail("ghost@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.loginUser(request))
                .isInstanceOf(RuntimeException.class);
    }
}
