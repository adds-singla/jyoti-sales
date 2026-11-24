package com.jyotisales.controller;

import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;


    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        var user = userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return ResponseEntity.ok(Map.of(
                "id",       user.getId(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "email",    user.getEmail()    != null ? user.getEmail()    : "",
                "phone",    user.getPhone()    != null ? user.getPhone()    : "",
                "role",     user.getRole().name(),
                "blocked",  user.isBlocked()
        ));
    }
}
