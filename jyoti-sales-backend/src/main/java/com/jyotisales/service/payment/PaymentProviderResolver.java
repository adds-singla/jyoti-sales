package com.jyotisales.service.payment;

import com.jyotisales.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Picks the active PaymentGatewayService implementation based on the
 * `app.payment.provider` config flag (dummy | razorpay | payu | ...).
 *
 * To add a real gateway later:
 *   1. Implement PaymentGatewayService in a new @Component (e.g. RazorpayGatewayProvider).
 *      See src/main/resources/payment-provider-templates/ for a starting-point sketch.
 *   2. Set app.payment.provider=razorpay (env var PAYMENT_PROVIDER=razorpay).
 *   3. Nothing else changes — controllers/services/DB schema are untouched because
 *      they only ever talk to the PaymentGatewayService interface.
 */
@Component
public class PaymentProviderResolver {

    @Value("${app.payment.provider}")
    private String activeProviderName;

    private final Map<String, PaymentGatewayService> providersByName;

    public PaymentProviderResolver(List<PaymentGatewayService> providers) {
        this.providersByName = providers.stream()
                .collect(Collectors.toMap(PaymentGatewayService::providerName, p -> p));
    }

    public PaymentGatewayService resolve() {
        PaymentGatewayService provider = providersByName.get(activeProviderName);
        if (provider == null) {
            throw ApiException.badRequest("No payment provider registered for: " + activeProviderName
                    + ". Available: " + providersByName.keySet());
        }
        return provider;
    }
}
