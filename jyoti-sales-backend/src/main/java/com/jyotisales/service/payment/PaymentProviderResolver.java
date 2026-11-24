package com.jyotisales.service.payment;

import com.jyotisales.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
