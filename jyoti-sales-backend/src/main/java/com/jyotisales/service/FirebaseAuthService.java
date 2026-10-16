package com.jyotisales.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.jyotisales.dto.AuthResponse;
import com.jyotisales.entity.Cart;
import com.jyotisales.entity.Role;
import com.jyotisales.entity.User;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.CartRepository;
import com.jyotisales.repository.UserRepository;
import com.jyotisales.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class FirebaseAuthService {

    @Nullable
    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final JwtService jwtService;

    public FirebaseAuthService(@Nullable FirebaseAuth firebaseAuth,
                               UserRepository userRepository,
                               CartRepository cartRepository,
                               JwtService jwtService) {
        this.firebaseAuth = firebaseAuth;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse authenticateWithFirebase(String idToken) {
        if (firebaseAuth == null) {
            throw ApiException.serviceUnavailable("Firebase Auth is not configured on this server. " +
                    "Add firebase-service-account.json to enable Google/Phone login.");
        }
        FirebaseToken decoded;
        try {
            decoded = firebaseAuth.verifyIdToken(idToken);
        } catch (Exception e) {
            throw ApiException.badRequest("Invalid Firebase token: " + e.getMessage());
        }

        String email = decoded.getEmail();
        String phone = decoded.getClaims().containsKey("phone_number")
                ? (String) decoded.getClaims().get("phone_number") : null;
        String name  = decoded.getName() != null ? decoded.getName() : "Customer";

        // Find or create user
        Optional<User> existing = Optional.empty();
        if (email != null) {
            existing = userRepository.findByEmail(email);
        }
        if (existing.isEmpty() && phone != null) {
            existing = userRepository.findByPhone(phone);
        }

        User user = existing.orElseGet(() -> {
            User u = new User();
            u.setFullName(name);
            u.setEmail(email);
            u.setPhone(phone);
            // Social-login users have no password — set a random unguessable hash
            u.setPasswordHash(UUID.randomUUID().toString());
            u.setRole(Role.ROLE_CUSTOMER);
            u = userRepository.save(u);

            // Create a cart for new users
            Cart cart = new Cart();
            cart.setUser(u);
            cartRepository.save(cart);
            return u;
        });

        // Update name if changed (e.g. Google profile update)
        if (!name.equals(user.getFullName())) {
            user.setFullName(name);
        }

        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        String subject = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String access  = jwtService.generateAccessToken(subject, user.getRole().name(), user.getId());
        String refresh = jwtService.generateRefreshToken(subject, user.getId());
        return new AuthResponse(access, refresh, user.getId(), user.getFullName(), user.getRole().name());
    }
}
