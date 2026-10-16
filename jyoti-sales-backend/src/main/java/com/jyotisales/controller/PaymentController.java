package com.jyotisales.controller;

import com.jyotisales.dto.PaymentInitiateRequest;
import com.jyotisales.dto.PaymentResponse;
import com.jyotisales.dto.RazorpayVerifyRequest;
import com.jyotisales.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PaymentController {

    private final PaymentService paymentService;

    /** Step 1 — Create a Razorpay order (or dummy/COD). Returns razorpayOrderId for the modal. */
    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiate(@Valid @RequestBody PaymentInitiateRequest req) {
        return ResponseEntity.ok(paymentService.initiate(req));
    }

    /**
     * Step 2 (Razorpay only) — Frontend calls this after the checkout.js modal succeeds.
     * Verifies HMAC-SHA256 signature and confirms the order.
     */
    @PostMapping("/razorpay/verify")
    public ResponseEntity<PaymentResponse> razorpayVerify(@Valid @RequestBody RazorpayVerifyRequest req) {
        // Pack the three Razorpay values into a single pipe-delimited string
        // that RazorpayGatewayProvider.verify() knows how to parse.
        String compoundRef = req.razorpayOrderId() + "|" + req.razorpayPaymentId() + "|" + req.razorpaySignature();
        return ResponseEntity.ok(paymentService.verify(req.paymentId(), compoundRef));
    }

    /** Legacy generic verify (still used by dummy provider / testing) */
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verify(@Valid @RequestBody
            com.jyotisales.dto.PaymentVerifyRequest req) {
        return ResponseEntity.ok(paymentService.verify(req.paymentId(), req.providerReference()));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<PaymentResponse> status(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getStatus(id));
    }
}
