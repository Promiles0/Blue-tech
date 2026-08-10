package com.ecom.Backend.security;

import com.ecom.Backend.entity.User;
import com.ecom.Backend.enums.RoleType;
import com.ecom.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Extract registration ID (google, facebook, etc.)
        String provider = userRequest.getClientRegistration().getRegistrationId();
        
        // Map attributes based on provider
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub"); // Google specific ID

        processOAuth2User(email, name, provider, providerId);

        return oAuth2User;
    }

    private void processOAuth2User(String email, String name, String provider, String providerId) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Update existing user provider if needed
            user.setProvider(provider);
            user.setProviderId(providerId);
            userRepository.save(user);
        } else {
            // Register new user
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .provider(provider)
                    .providerId(providerId)
                    .role(RoleType.CUSTOMER)
                    .build();
            userRepository.save(newUser);
        }
    }
}
