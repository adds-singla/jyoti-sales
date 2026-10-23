package com.jyotisales.dto;

import com.jyotisales.entity.User;
import java.time.Instant;

public record CustomerSummary(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        boolean blocked,
        Instant createdAt
) {
    public static CustomerSummary from(User u) {
        return new CustomerSummary(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole().name(),
                u.isBlocked(),
                u.getCreatedAt()
        );
    }
}
