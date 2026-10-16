package com.jyotisales.service.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.annotation.PostConstruct;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Real Razorpay payment gateway provider.
 *
 * Flow:
 *  1. Frontend calls POST /payments/initiate → this creates a Razorpay order
 *     and returns { razorpayOrderId, razorpayKeyId, paymentId, status: INITIATED }.
 *  2. Frontend opens Razorpay checkout.js modal with those values.
 *  3. On success, Razorpay returns { razorpayPaymentId, razorpayOrderId, razorpaySignature }.
 *  4. Frontend calls POST /payments/razorpay/verify with those values + our paymentId.
 *  5. This provider verifies the HMAC-SHA256 signature. If valid → order confirmed.
 *
 * Activated by setting: PAYMENT_PROVIDER=razorpay
 */
@Component
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "razorpay")
public class RazorpayGatewayProvider implements PaymentGatewayService {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private RazorpayClient client;

    @PostConstruct
    void init() throws RazorpayException {
        this.client = new RazorpayClient(keyId, keySecret);
    }

    @Override
    public String providerName() { return "razorpay"; }

    @Override
    public GatewayInitiateResult initiate(InitiateCommand command) {
        if ("COD".equalsIgnoreCase(command.method())) {
            return new GatewayInitiateResult(
                    "COD-" + command.orderId(), GatewayStatus.INITIATED,
                    "Order placed. Pay cash on delivery.", false);
        }

        try {
            // Amount in paise (Razorpay requires integer paise, not rupees)
            long amountInPaise = command.amount()
                    .multiply(BigDecimal.valueOf(100))
                    .longValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + command.orderId());
            orderRequest.put("payment_capture", 1); // auto-capture

            Order razorpayOrder = client.orders.create(orderRequest);
            String rzpOrderId = razorpayOrder.get("id");

            return new GatewayInitiateResult(
                    rzpOrderId,                  // stored as providerReference
                    GatewayStatus.INITIATED,
                    "Razorpay order created. Complete payment in the popup.",
                    false,
                    rzpOrderId,                  // razorpayOrderId for the modal
                    keyId                        // razorpayKeyId for the modal
            );
        } catch (RazorpayException e) {
            return new GatewayInitiateResult(
                    "ERR-" + System.currentTimeMillis(),
                    GatewayStatus.FAILED,
                    "Failed to create Razorpay order: " + e.getMessage(),
                    false);
        }
    }

    /**
     * Verifies the Razorpay signature after the checkout.js modal completes.
     * providerReference format expected: "razorpayOrderId|razorpayPaymentId|razorpaySignature"
     */
    @Override
    public GatewayVerifyResult verify(String providerReference) {
        String[] parts = providerReference.split("\\|", 3);
        if (parts.length != 3) {
            return new GatewayVerifyResult(providerReference, GatewayStatus.FAILED,
                    "Invalid verification payload");
        }
        String rzpOrderId   = parts[0];
        String rzpPaymentId = parts[1];
        String signature    = parts[2];

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id",   rzpOrderId);
            attributes.put("razorpay_payment_id", rzpPaymentId);
            attributes.put("razorpay_signature",  signature);

            Utils.verifyPaymentSignature(attributes, keySecret);
            // If above doesn't throw → signature is valid
            return new GatewayVerifyResult(rzpPaymentId, GatewayStatus.SUCCESS,
                    "Payment verified successfully");
        } catch (RazorpayException e) {
            return new GatewayVerifyResult(providerReference, GatewayStatus.FAILED,
                    "Signature verification failed: " + e.getMessage());
        }
    }

    @Override
    public GatewayStatus getStatus(String providerReference) {
        try {
            com.razorpay.Payment payment = client.payments.fetch(providerReference);
            String status = payment.get("status");
            return switch (status) {
                case "captured", "authorized" -> GatewayStatus.SUCCESS;
                case "failed"                 -> GatewayStatus.FAILED;
                default                       -> GatewayStatus.PENDING;
            };
        } catch (RazorpayException e) {
            return GatewayStatus.FAILED;
        }
    }
}
