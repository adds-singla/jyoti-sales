package com.jyotisales.controller;

import com.jyotisales.dto.*;
import com.jyotisales.service.AuthService;
import com.jyotisales.service.FirebaseAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final FirebaseAuthService firebaseAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String usernameOrPhone) {
        return ResponseEntity.ok(authService.forgotPassword(usernameOrPhone));
    }

    /**
     * Exchange a Firebase ID token (from Google Sign-In or Phone OTP)
     * for a Jyoti Sales JWT. Creates the account on first use.
     */
    @PostMapping("/firebase")
    public ResponseEntity<AuthResponse> firebaseLogin(@Valid @RequestBody FirebaseAuthRequest req) {
        return ResponseEntity.ok(firebaseAuthService.authenticateWithFirebase(req.idToken()));
    }
}
