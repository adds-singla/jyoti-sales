package com.jyotisales.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String fullName,
        String role
) {}
