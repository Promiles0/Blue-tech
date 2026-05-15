package com.ecom.Backend.config;

import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.name}")
    private String adminName;

    @Value("${app.admin.phone}")
    private String adminPhone;

    @Override
    public void run(String... args) throws Exception {
        // We check if the Master Admin already exists
        User adminUser = userRepository.findByEmail(adminEmail).orElse(null);

        if (adminUser == null) {
            // If not, we create the Master Admin account automatically
            adminUser = User.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword)) 
                    .phone(adminPhone)
                    .role(RoleType.ADMIN) // Crucial: Set to ADMIN
                    .build();

            userRepository.save(adminUser);
            System.out.println("==============================================");
            System.out.println(" MASTER ADMIN CREATED: " + adminEmail);
            System.out.println("==============================================");
        } else {
            // If it exists, ensure it has the ADMIN role
            if (adminUser.getRole() != RoleType.ADMIN) {
                adminUser.setRole(RoleType.ADMIN);
                userRepository.save(adminUser);
                System.out.println("==============================================");
                System.out.println(" MASTER ADMIN ROLE FIXED TO ADMIN: " + adminEmail);
                System.out.println("==============================================");
            }
        }
    }
}
