package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;

public record FirebaseAuthRequest(
        @NotBlank String idToken
) {}
