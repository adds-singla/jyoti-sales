package com.jyotisales.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email String email,
        String phone,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
) {}
