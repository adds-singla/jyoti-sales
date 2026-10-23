package com.jyotisales.controller;

import com.jyotisales.dto.CustomerSummary;
import com.jyotisales.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<CustomerSummary>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.listCustomers(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<CustomerSummary> block(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.setBlocked(id, true));
    }

    @PatchMapping("/{id}/unblock")
    public ResponseEntity<CustomerSummary> unblock(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.setBlocked(id, false));
    }
}
