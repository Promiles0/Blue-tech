package com.ecom.Backend.service;

import com.ecom.Backend.service.NotificationService;
import com.ecom.Backend.enums.NotificationCategory;
import com.ecom.Backend.enums.NotificationSeverity;
import com.ecom.Backend.dto.request.GoogleLoginRequest;
import com.ecom.Backend.dto.request.PasswordChangeRequest;
import com.ecom.Backend.dto.request.ProfileUpdateRequest;
import com.ecom.Backend.dto.request.ResetPasswordRequest;
import com.ecom.Backend.dto.request.UserLoginRequest;
import com.ecom.Backend.dto.request.UserRegisterRequest;
import com.ecom.Backend.dto.response.AuthResponse;
import com.ecom.Backend.dto.response.UserResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.UserRepository;
import com.ecom.Backend.security.CustomUserDetailsService;
import com.ecom.Backend.security.JwtService;
import com.ecom.Backend.service.EmailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("all")
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Value("${app.google.web-client-id}")
    private String googleWebClientId;

    // Helper to get the logged-in User entity from the Security Context
    public User getCurrentAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            email = ((org.springframework.security.oauth2.core.user.OAuth2User) principal).getAttribute("email");
        } else {
            email = principal.toString();
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found in database: " + email));
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
                .role(RoleType.CUSTOMER)
                .build();

        // 3. Save to Database
        User savedUser = userRepository.save(newUser);

        // 4. Map Entity back to safe Response DTO
        UserResponse userResponse = UserResponse.builder()
                .userId(savedUser.getUserId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .picture(savedUser.getPicture())
                .role(savedUser.getRole())
                .build();
                
        // 5. Generate JWT Token for immediate login after registration
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);
        
        // 6. Send Welcome Email
        try {
            emailService.sendEmail(
                savedUser.getEmail(),
                "Welcome to Our Platform!",
                "<h1>Welcome " + savedUser.getName() + "!</h1><p>Thank you for joining us. Start shopping now!</p>"
            );
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        // 7. Notify admin of new customer
        try {
            notificationService.emitAdminNotification(
                NotificationCategory.ACCOUNT, NotificationSeverity.INFO,
                "New Customer: " + savedUser.getName(),
                savedUser.getEmail() + " just created an account.",
                "/admin/users"
            );
        } catch (Exception e) {
            System.err.println("Failed to emit admin notification: " + e.getMessage());
        }
        
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userResponse)
                .build();
    }

    public AuthResponse loginUser(UserLoginRequest request) {
        // 1. Authenticate the user (throws BadCredentialsException if wrong password)
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            // Re-throw as RuntimeException so GlobalExceptionHandler handles it
            // instead of Spring Security's ExceptionTranslationFilter (which returns
            // a generic "Unauthorized" message).
            throw new RuntimeException("Invalid email or password");
        }

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
                .picture(user.getPicture())
                .role(user.getRole())
                .build();

        // 5. Return Token + Profile
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userResponse)
                .build();
    }

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        if (googleWebClientId == null || googleWebClientId.isBlank()) {
            throw new RuntimeException("Google web client ID is not configured.");
        }

        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleWebClientId))
                    .setIssuers(Arrays.asList("https://accounts.google.com", "accounts.google.com"))
                    .build();
            idToken = verifier.verify(request.getToken());
        } catch (Exception e) {
            throw new RuntimeException("Google token verification failed: " + e.getMessage());
        }

        if (idToken == null) {
            throw new RuntimeException("Invalid or expired Google token. Ensure http://localhost:5173 is an Authorized JavaScript Origin in Google Cloud Console.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email    = payload.getEmail();
        String googleId = payload.getSubject();

        if (email == null || googleId == null) {
            throw new RuntimeException("Google token is missing required fields (email/sub).");
        }

        String name    = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .name(name)
                        .email(email)
                        .picture(picture)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .provider("google")
                        .providerId(googleId)
                        .role(RoleType.CUSTOMER)
                        .createdAt(LocalDateTime.now())
                        .build())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        UserResponse userResponse = UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .picture(user.getPicture())
                .role(user.getRole())
                .build();

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

    public UserResponse mapToUserResponsePublic(User user) {
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .picture(user.getPicture())
                .role(user.getRole())
                .build();
    }
}
