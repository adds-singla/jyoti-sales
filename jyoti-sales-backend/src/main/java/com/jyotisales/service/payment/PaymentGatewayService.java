package com.jyotisales.service.payment;

import java.math.BigDecimal;

/**
 * The single contract every payment provider must fulfill.
 *
 * All checkout / order business logic in the application depends ONLY on this
 * interface — never on a concrete provider class. This is what lets the app
 * ship with {@link DummyPaymentGatewayProvider} today and swap in a real
 * provider (Razorpay, PayU, ...) later by:
 *   1. Adding a new class that implements this interface, and
 *   2. Flipping the `app.payment.provider` config flag,
 * with zero changes to controllers, services, or the database schema.
 */
public interface PaymentGatewayService {

    /**
     * Identifies which provider this implementation is ("dummy", "razorpay", "payu", ...).
     * Stored on the Payment record so we always know which gateway handled a transaction.
     */
    String providerName();

    /**
     * Begins a payment attempt for an order. Returns a GatewayInitiateResult describing
     * whatever the caller needs next (e.g. a client secret, a redirect URL, or — for the
     * dummy provider — the seeded test-mode instructions).
     */
    GatewayInitiateResult initiate(InitiateCommand command);

    /**
     * Confirms/settles a previously-initiated payment given the provider's reference id.
     * For a real gateway this typically calls the provider's verification API and/or
     * checks a signature; for the dummy provider it resolves the deterministic outcome
     * keyed off the seeded test card/UPI/bank value used at initiate() time.
     */
    GatewayVerifyResult verify(String providerReference);

    /**
     * Point-in-time status lookup for a payment, keyed by provider reference.
     */
    GatewayStatus getStatus(String providerReference);

    record InitiateCommand(
            Long orderId,
            BigDecimal amount,
            String method,       // CARD | UPI | NET_BANKING | COD
            String cardNumber,
            String cardExpiry,
            String cardCvv,
            String upiId,
            String bankCode
    ) {}

    record GatewayInitiateResult(
            String providerReference,
            GatewayStatus status,
            String message,
            boolean testMode
    ) {}

    record GatewayVerifyResult(
            String providerReference,
            GatewayStatus status,
            String message
    ) {}

    enum GatewayStatus { INITIATED, SUCCESS, FAILED, PENDING }
}
