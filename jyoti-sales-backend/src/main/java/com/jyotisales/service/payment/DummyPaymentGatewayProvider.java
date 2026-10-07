package com.jyotisales.service.payment;

import com.jyotisales.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sandbox-only payment provider, active by default (app.payment.provider=dummy).
 *
 * NOT PCI-DSS compliant. NOT a real payment processor. Every card/UPI/bank value
 * here is a seeded test fixture — nothing is sent to any external network. This
 * class exists purely so the checkout flow has a deterministic, swappable
 * implementation of {@link PaymentGatewayService} to build and test against
 * before a real gateway (Razorpay/PayU/...) is wired in.
 *
 * Outcome is deterministic by seeded test value so QA/demo flows are repeatable:
 *   Card numbers ending in ...1111 -> SUCCESS   (Visa test success)
 *   Card numbers ending in ...0002 -> FAILED    (generic decline)
 *   Any other 16-digit Luhn-valid card -> SUCCESS
 *   UPI id "success@upi"  -> SUCCESS
 *   UPI id "failure@upi"  -> FAILED
 *   Any other UPI id -> SUCCESS
 *   Net banking bank code "FAILBANK" -> FAILED, anything else -> SUCCESS
 *   COD -> always INITIATED (settled on delivery, not here)
 */
@Component
public class DummyPaymentGatewayProvider implements PaymentGatewayService {

    private static final String PROVIDER = "dummy";
    private static final Set<String> DECLINE_CARD_SUFFIXES = Set.of("0002");
    private static final Set<String> SUCCESS_CARD_SUFFIXES = Set.of("1111");

    // in-memory ledger of simulated transactions, keyed by providerReference
    private final Map<String, GatewayStatus> simulatedLedger = new ConcurrentHashMap<>();

    @Value("${app.payment.provider}")
    private String activeProvider;

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public GatewayInitiateResult initiate(InitiateCommand command) {
        String method = command.method() == null ? "" : command.method().toUpperCase();
        String reference = "DUMMY-TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        // simulate 1-2s network latency of a real gateway
        simulateLatency();

        GatewayStatus outcome = switch (method) {
            case "CARD" -> resolveCardOutcome(command.cardNumber(), command.cardExpiry(), command.cardCvv());
            case "UPI" -> resolveUpiOutcome(command.upiId());
            case "NET_BANKING" -> resolveBankOutcome(command.bankCode());
            case "COD" -> GatewayStatus.INITIATED; // settled on delivery
            default -> throw ApiException.badRequest("Unsupported payment method: " + command.method());
        };

        simulatedLedger.put(reference, outcome);

        String message = switch (outcome) {
            case SUCCESS -> "[TEST MODE] Payment approved by dummy gateway.";
            case FAILED -> "[TEST MODE] Payment declined by dummy gateway (seeded test outcome).";
            case INITIATED -> "[TEST MODE] Cash on Delivery order placed. Pay on delivery.";
            case PENDING -> "[TEST MODE] Payment pending.";
        };

        return new GatewayInitiateResult(reference, outcome, message, true);
    }

    @Override
    public GatewayVerifyResult verify(String providerReference) {
        GatewayStatus status = simulatedLedger.getOrDefault(providerReference, GatewayStatus.FAILED);
        String message = status == GatewayStatus.SUCCESS
                ? "[TEST MODE] Verified: payment settled."
                : "[TEST MODE] Verification failed or payment not found.";
        return new GatewayVerifyResult(providerReference, status, message);
    }

    @Override
    public GatewayStatus getStatus(String providerReference) {
        return simulatedLedger.getOrDefault(providerReference, GatewayStatus.FAILED);
    }

    // ---- deterministic seeded-outcome helpers (dummy-provider only) ----

    private GatewayStatus resolveCardOutcome(String cardNumber, String expiry, String cvv) {
        if (cardNumber == null || cardNumber.replaceAll("\\s", "").length() < 12) {
            throw ApiException.badRequest("Invalid test card number");
        }
        String digits = cardNumber.replaceAll("\\s", "");
        if (!isLuhnValid(digits)) {
            return GatewayStatus.FAILED;
        }
        String suffix = digits.substring(digits.length() - 4);
        if (DECLINE_CARD_SUFFIXES.contains(suffix)) return GatewayStatus.FAILED;
        if (SUCCESS_CARD_SUFFIXES.contains(suffix)) return GatewayStatus.SUCCESS;
        return GatewayStatus.SUCCESS; // default: any other Luhn-valid test card succeeds
    }

    private GatewayStatus resolveUpiOutcome(String upiId) {
        if (upiId == null || !upiId.contains("@")) {
            throw ApiException.badRequest("Invalid test UPI id");
        }
        if (upiId.equalsIgnoreCase("failure@upi")) return GatewayStatus.FAILED;
        return GatewayStatus.SUCCESS;
    }

    private GatewayStatus resolveBankOutcome(String bankCode) {
        if (bankCode == null || bankCode.isBlank()) {
            throw ApiException.badRequest("Bank code required for net banking");
        }
        if (bankCode.equalsIgnoreCase("FAILBANK")) return GatewayStatus.FAILED;
        return GatewayStatus.SUCCESS;
    }

    /** Standard Luhn checksum — validated purely against the dummy test card, no real card data ever touches this. */
    public static boolean isLuhnValid(String number) {
        int sum = 0;
        boolean alternate = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            char c = number.charAt(i);
            if (!Character.isDigit(c)) return false;
            int n = Character.getNumericValue(c);
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    private void simulateLatency() {
        try {
            Thread.sleep(1000 + (long) (Math.random() * 1000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
