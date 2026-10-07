package com.jyotisales.service;

import com.jyotisales.dto.*;
import com.jyotisales.entity.Cart;
import com.jyotisales.entity.Role;
import com.jyotisales.entity.User;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.CartRepository;
import com.jyotisales.repository.UserRepository;
import com.jyotisales.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.email() == null && req.phone() == null) {
            throw ApiException.badRequest("Either email or phone is required");
        }
        if (req.email() != null && userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("Email already registered");
        }
        if (req.phone() != null && userRepository.existsByPhone(req.phone())) {
            throw ApiException.conflict("Phone already registered");
        }

        User user = new User();
        user.setFullName(req.fullName());
        user.setEmail(req.email());
        user.setPhone(req.phone());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.ROLE_CUSTOMER);
        user = userRepository.save(user);

        Cart cart = new Cart();
        cart.setUser(user);
        cartRepository.save(cart);

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.usernameOrPhone(), req.password()));

        User user = userRepository.findByEmail(req.usernameOrPhone())
                .or(() -> userRepository.findByPhone(req.usernameOrPhone()))
                .orElseThrow(() -> ApiException.notFound("User not found"));

        return issueTokens(user);
    }

    public AuthResponse refresh(RefreshRequest req) {
        String subject = jwtService.extractSubject(req.refreshToken());
        if (!"refresh".equals(jwtService.extractTokenType(req.refreshToken()))
                || !jwtService.isTokenValid(req.refreshToken(), subject)) {
            throw ApiException.badRequest("Invalid or expired refresh token");
        }
        User user = userRepository.findByEmail(subject)
                .or(() -> userRepository.findByPhone(subject))
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return issueTokens(user);
    }

    /** Mock forgot-password: in a real system this would email/SMS a reset link/OTP. */
    public String forgotPassword(String usernameOrPhone) {
        boolean exists = userRepository.findByEmail(usernameOrPhone)
                .or(() -> userRepository.findByPhone(usernameOrPhone)).isPresent();
        // Always respond the same way regardless of existence, to avoid account enumeration.
        return exists
                ? "If that account exists, a password reset link has been sent (mock)."
                : "If that account exists, a password reset link has been sent (mock).";
    }

    private AuthResponse issueTokens(User user) {
        String subject = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String access = jwtService.generateAccessToken(subject, user.getRole().name(), user.getId());
        String refresh = jwtService.generateRefreshToken(subject, user.getId());
        return new AuthResponse(access, refresh, user.getId(), user.getFullName(), user.getRole().name());
    }
}
