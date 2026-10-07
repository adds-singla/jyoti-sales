package com.jyotisales.service.payment;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class DummyPaymentGatewayProviderTest {

    private final DummyPaymentGatewayProvider provider = new DummyPaymentGatewayProvider();

    @Test
    void luhnValidatesKnownGoodCardNumber() {
        assertTrue(DummyPaymentGatewayProvider.isLuhnValid("4111111111111111"));
    }

    @Test
    void luhnRejectsKnownBadCardNumber() {
        assertFalse(DummyPaymentGatewayProvider.isLuhnValid("4111111111111112"));
    }

    @Test
    void cardEndingIn1111SucceedsInTestMode() {
        var command = new PaymentGatewayService.InitiateCommand(
                1L, BigDecimal.valueOf(1000), "CARD", "4111111111111111", "12/29", "123", null, null);
        var result = provider.initiate(command);
        assertEquals(PaymentGatewayService.GatewayStatus.SUCCESS, result.status());
        assertTrue(result.testMode());
    }

    @Test
    void cardEndingIn0002DeclinesInTestMode() {
        var command = new PaymentGatewayService.InitiateCommand(
                1L, BigDecimal.valueOf(1000), "CARD", "4111111111110002", "12/29", "123", null, null);
        var result = provider.initiate(command);
        assertEquals(PaymentGatewayService.GatewayStatus.FAILED, result.status());
    }

    @Test
    void upiFailureAddressFails() {
        var command = new PaymentGatewayService.InitiateCommand(
                1L, BigDecimal.valueOf(1000), "UPI", null, null, null, "failure@upi", null);
        var result = provider.initiate(command);
        assertEquals(PaymentGatewayService.GatewayStatus.FAILED, result.status());
    }

    @Test
    void codAlwaysInitiated() {
        var command = new PaymentGatewayService.InitiateCommand(
                1L, BigDecimal.valueOf(1000), "COD", null, null, null, null, null);
        var result = provider.initiate(command);
        assertEquals(PaymentGatewayService.GatewayStatus.INITIATED, result.status());
    }
}
