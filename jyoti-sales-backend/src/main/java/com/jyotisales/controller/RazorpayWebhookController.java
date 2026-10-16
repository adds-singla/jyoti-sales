package com.jyotisales.controller;

import com.jyotisales.repository.PaymentRepository;
import com.jyotisales.service.OrderService;
import com.jyotisales.entity.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Receives server-to-server webhook events from Razorpay.
 *
 * This is the SAFETY NET for #3 in the market readiness list:
 * If the user closes the browser before the frontend calls /payments/razorpay/verify,
 * Razorpay still calls this endpoint when the payment is captured — so orders
 * are NEVER left stranded in PENDING status.
 *
 * Setup in Razorpay Dashboard → Webhooks → Add Webhook:
 *   URL: https://yourdomain.com/api/payments/razorpay/webhook
 *   Events: payment.captured, payment.failed
 *   Secret: set RAZORPAY_WEBHOOK_SECRET env var to the same value
 */
@Slf4j
@RestController
@RequestMapping("/api/payments/razorpay/webhook")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<String> handle(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String rawBody) {

        // 1. Verify signature (skip if webhook-secret not configured yet)
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (!isValidSignature(rawBody, signature)) {
                log.warn("[WEBHOOK] Invalid Razorpay signature — ignoring event.");
                return ResponseEntity.ok("ignored");
            }
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String event = payload.optString("event", "");
            log.info("[WEBHOOK] Razorpay event received: {}", event);

            JSONObject paymentEntity = payload
                    .optJSONObject("payload")
                    .optJSONObject("payment")
                    .optJSONObject("entity");

            if (paymentEntity == null) {
                return ResponseEntity.ok("no payment entity");
            }

            String rzpOrderId   = paymentEntity.optString("order_id");
            String rzpPaymentId = paymentEntity.optString("id");
            String status       = paymentEntity.optString("status");

            switch (event) {
                case "payment.captured" -> handleCaptured(rzpOrderId, rzpPaymentId);
                case "payment.failed"   -> handleFailed(rzpOrderId);
                default                 -> log.debug("[WEBHOOK] Unhandled event: {}", event);
            }

        } catch (Exception e) {
            log.error("[WEBHOOK] Error processing Razorpay webhook: {}", e.getMessage(), e);
        }

        // Always return 200 — Razorpay retries on non-2xx responses
        return ResponseEntity.ok("received");
    }

    private void handleCaptured(String rzpOrderId, String rzpPaymentId) {
        // Find the Payment row by its providerReference (which is the Razorpay order ID)
        paymentRepository.findByProviderReference(rzpOrderId).ifPresentOrElse(payment -> {
            if (payment.getStatus() == Payment.Status.SUCCESS) {
                log.info("[WEBHOOK] Payment {} already confirmed — idempotent skip.", rzpOrderId);
                return;
            }
            payment.setStatus(Payment.Status.SUCCESS);
            payment.setProviderReference(rzpPaymentId); // Update to actual payment ID
            paymentRepository.save(payment);
            orderService.markConfirmedAndDecrementStock(payment.getOrder().getId());
            log.info("[WEBHOOK] ✅ Order confirmed via webhook for Razorpay order {}", rzpOrderId);
        }, () -> log.warn("[WEBHOOK] No payment found for Razorpay order {}", rzpOrderId));
    }

    private void handleFailed(String rzpOrderId) {
        paymentRepository.findByProviderReference(rzpOrderId).ifPresent(payment -> {
            if (payment.getStatus() != Payment.Status.FAILED) {
                payment.setStatus(Payment.Status.FAILED);
                payment.setFailureReason("Payment failed (Razorpay webhook)");
                paymentRepository.save(payment);
                orderService.markFailed(payment.getOrder().getId());
                log.info("[WEBHOOK] ❌ Order failed via webhook for Razorpay order {}", rzpOrderId);
            }
        });
    }

    private boolean isValidSignature(String payload, String signature) {
        if (signature == null || signature.isBlank()) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);
            return computed.equals(signature);
        } catch (Exception e) {
            log.error("[WEBHOOK] Signature computation error: {}", e.getMessage());
            return false;
        }
    }
}
