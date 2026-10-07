package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;

public record AddressRequest(
        String label,
        @NotBlank String recipientName,
        @NotBlank String phone,
        @NotBlank String line1,
        String line2,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String pincode,
        boolean isDefault
) {}
