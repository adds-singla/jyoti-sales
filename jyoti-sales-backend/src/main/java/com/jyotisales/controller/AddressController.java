package com.jyotisales.controller;

import com.jyotisales.dto.AddressRequest;
import com.jyotisales.entity.Address;
import com.jyotisales.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<Address>> list() {
        return ResponseEntity.ok(addressService.list(CurrentUser.id()));
    }

    @PostMapping
    public ResponseEntity<Address> add(@Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(addressService.add(CurrentUser.id(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> update(@PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(addressService.update(CurrentUser.id(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        addressService.delete(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }
}
