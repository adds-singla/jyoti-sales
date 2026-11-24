package com.jyotisales.service.payment;

import java.math.BigDecimal;

public interface PaymentGatewayService {

    String providerName();

    GatewayInitiateResult initiate(InitiateCommand command);

    GatewayVerifyResult verify(String providerReference);

    GatewayStatus getStatus(String providerReference);

    record InitiateCommand(
            Long orderId,
            BigDecimal amount,
            String method,
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
            boolean testMode,

            String razorpayOrderId,
            String razorpayKeyId
    ) {

        public GatewayInitiateResult(String providerReference, GatewayStatus status,
                                      String message, boolean testMode) {
            this(providerReference, status, message, testMode, null, null);
        }
    }

    record GatewayVerifyResult(
            String providerReference,
            GatewayStatus status,
            String message
    ) {}

    enum GatewayStatus { INITIATED, SUCCESS, FAILED, PENDING }
}
