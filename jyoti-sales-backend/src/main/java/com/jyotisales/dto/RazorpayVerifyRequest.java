package com.jyotisales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Frontend sends this after the Razorpay checkout.js modal completes
 * so we can verify the payment signature server-side.
 */
public record RazorpayVerifyRequest(
        @NotNull  Long   paymentId,          // our DB Payment row id
        @NotBlank String razorpayOrderId,    // rzp_order_xxx
        @NotBlank String razorpayPaymentId,  // pay_xxx
        @NotBlank String razorpaySignature   // HMAC-SHA256 from Razorpay
) {}
