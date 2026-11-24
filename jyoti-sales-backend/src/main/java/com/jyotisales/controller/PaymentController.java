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


    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiate(@Valid @RequestBody PaymentInitiateRequest req) {
        return ResponseEntity.ok(paymentService.initiate(req));
    }


    @PostMapping("/razorpay/verify")
    public ResponseEntity<PaymentResponse> razorpayVerify(@Valid @RequestBody RazorpayVerifyRequest req) {

        String compoundRef = req.razorpayOrderId() + "|" + req.razorpayPaymentId() + "|" + req.razorpaySignature();
        return ResponseEntity.ok(paymentService.verify(req.paymentId(), compoundRef));
    }


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
