package com.ecom.Backend.service;

import com.ecom.Backend.dto.request.*;
import com.ecom.Backend.dto.response.AuthResponse;
import com.ecom.Backend.dto.response.UserResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.repository.UserRepository;
import com.ecom.Backend.security.CustomUserDetailsService;
import com.ecom.Backend.security.JwtService;
import com.ecom.Backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService;

    // Helper to get the logged-in User entity from the Security Context
    public User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found in database"));
    }

    public AuthResponse registerUser(UserRegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        // 2. Map DTO to Entity and Hash Password
        User newUser = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(RoleType.CUSTOMER) // Default role is customer
                .build();

        // 3. Save to Database
        User savedUser = userRepository.save(newUser);

        // 4. Map Entity back to safe Response DTO
        UserResponse userResponse = UserResponse.builder()
                .userId(savedUser.getUserId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole())
                .build();
                
        // 5. Generate JWT Token for immediate login after registration
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);
        
        // 6. Send Welcome Email
        emailService.sendEmail(
            savedUser.getEmail(), 
            "Welcome to Our Platform!", 
            "<h1>Welcome " + savedUser.getName() + "!</h1><p>Thank you for joining us. Start shopping now!</p>"
        );
        
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userResponse)
                .build();
    }

    public AuthResponse loginUser(UserLoginRequest request) {
        // 1. Authenticate the user (This throws an exception if password is bad)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Fetch User from DB to get the ID and details
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Generate JWT Token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        // 4. Map Entity to safe Response DTO
        UserResponse userResponse = UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();

        // 5. Return Token + Profile
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userResponse)
                .build();
    }

    public UserResponse updateProfile(User user, ProfileUpdateRequest request) {
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    public void changePassword(User user, PasswordChangeRequest request) {
        // 1. Check if old password matches
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password does not match");
        }

        // 2. Hash and save new password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with this email"));

        // Generate token
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30)); // 30 min expiry
        userRepository.save(user);

        // Send real email
        emailService.sendPasswordResetToken(email, token);
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired");
        }

        // Update password and clear token
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }
}
