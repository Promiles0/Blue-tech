package com.ecom.Backend.service;

import com.ecom.Backend.dto.response.AdminUserResponse;
import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.exception.ResourceNotFoundException;
import com.ecom.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AdminUserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public List<AdminUserResponse> listUsers(String search) {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(q))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }
        return users.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public AdminUserResponse setAdminRole(Long userId, boolean makeAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(makeAdmin ? RoleType.ADMIN : RoleType.CUSTOMER);
        userRepository.save(user);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        String action = makeAdmin ? "user.grant_admin" : "user.revoke_admin";
        auditLogService.log(adminId, action, "users", String.valueOf(userId),
                action + " for user " + user.getEmail(), null);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse setSuspended(Long userId, boolean suspend) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setSuspended(suspend);
        userRepository.save(user);

        Long adminId = authService.getCurrentAuthenticatedUser().getUserId();
        String action = suspend ? "user.suspend" : "user.unsuspend";
        auditLogService.log(adminId, action, "users", String.valueOf(userId),
                action + " for user " + user.getEmail(), null);
        return toResponse(user);
    }

    private AdminUserResponse toResponse(User u) {
        int orderCount = u.getOrders() != null ? u.getOrders().size() : 0;
        BigDecimal totalSpent = u.getOrders() == null ? BigDecimal.ZERO :
                u.getOrders().stream()
                        .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        return AdminUserResponse.builder()
                .userId(u.getUserId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .isSuspended(u.isSuspended())
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .orderCount(orderCount)
                .totalSpent(totalSpent)
                .build();
    }
}
