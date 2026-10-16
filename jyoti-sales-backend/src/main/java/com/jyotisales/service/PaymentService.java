package com.jyotisales.service;

import com.jyotisales.dto.PaymentInitiateRequest;
import com.jyotisales.dto.PaymentResponse;
import com.jyotisales.entity.Order;
import com.jyotisales.entity.Payment;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.PaymentRepository;
import com.jyotisales.service.payment.PaymentGatewayService;
import com.jyotisales.service.payment.PaymentProviderResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business-logic layer for payments. This is the ONLY class (besides controllers)
 * that touches payment concerns, and it depends purely on PaymentGatewayService —
 * never on DummyPaymentGatewayProvider or any other concrete provider directly.
 * Swapping providers never requires touching this class.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentProviderResolver providerResolver;
    private final OrderService orderService;

    @Transactional
    public PaymentResponse initiate(PaymentInitiateRequest req) {
        Order order = orderService.getEntity(req.orderId());
        if (order.getStatus() != Order.Status.PENDING) {
            throw ApiException.badRequest("Order is not awaiting payment");
        }

        PaymentGatewayService gateway = providerResolver.resolve();

        var command = new PaymentGatewayService.InitiateCommand(
                order.getId(), order.getTotal(), req.method(),
                req.cardNumber(), req.cardExpiry(), req.cardCvv(), req.upiId(), req.bankCode());

        var result = gateway.initiate(command);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(Payment.Method.valueOf(req.method().toUpperCase()));
        payment.setAmount(order.getTotal());
        payment.setProvider(gateway.providerName());
        payment.setProviderReference(result.providerReference());
        payment.setStatus(mapStatus(result.status()));
        if (result.status() == PaymentGatewayService.GatewayStatus.FAILED) {
            payment.setFailureReason(result.message());
        }
        payment = paymentRepository.save(payment);

        // For COD / dummy: mark immediately. For Razorpay INITIATED, we wait for verify().
        if (result.status() == PaymentGatewayService.GatewayStatus.SUCCESS) {
            orderService.markConfirmedAndDecrementStock(order.getId());
        } else if (result.status() == PaymentGatewayService.GatewayStatus.FAILED) {
            orderService.markFailed(order.getId());
        }

        return toResponse(payment, gateway.providerName(), result.message(),
                result.razorpayOrderId(), result.razorpayKeyId());
    }

    @Transactional
    public PaymentResponse verify(Long paymentId, String providerReference) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));

        PaymentGatewayService gateway = providerResolver.resolve();
        var result = gateway.verify(providerReference);

        payment.setStatus(mapStatus(result.status()));
        payment = paymentRepository.save(payment);

        if (result.status() == PaymentGatewayService.GatewayStatus.SUCCESS) {
            orderService.markConfirmedAndDecrementStock(payment.getOrder().getId());
        }

        return toResponse(payment, gateway.providerName(), result.message(), null, null);
    }

    public PaymentResponse getStatus(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        PaymentGatewayService gateway = providerResolver.resolve();
        var status = gateway.getStatus(payment.getProviderReference());
        return toResponse(payment, gateway.providerName(), "Status: " + status, null, null);
    }

    private Payment.Status mapStatus(PaymentGatewayService.GatewayStatus status) {
        return switch (status) {
            case SUCCESS -> Payment.Status.SUCCESS;
            case FAILED -> Payment.Status.FAILED;
            case INITIATED, PENDING -> Payment.Status.INITIATED;
        };
    }

    private PaymentResponse toResponse(Payment p, String providerName, String message,
                                        String razorpayOrderId, String razorpayKeyId) {
        boolean testMode = "dummy".equals(providerName);
        return new PaymentResponse(p.getId(), p.getOrder().getId(), p.getMethod().name(), p.getStatus().name(),
                p.getAmount(), p.getProvider(), p.getProviderReference(),
                p.getFailureReason() != null ? p.getFailureReason() : message,
                testMode, razorpayOrderId, razorpayKeyId);
    }
}
