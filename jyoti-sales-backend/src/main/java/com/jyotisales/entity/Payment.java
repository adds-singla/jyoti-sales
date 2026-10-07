package com.jyotisales.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    public enum Method { CARD, UPI, NET_BANKING, COD }
    public enum Status { INITIATED, SUCCESS, FAILED, REFUNDED }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Method method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.INITIATED;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // Which provider handled this payment: dummy | razorpay | payu
    @Column(nullable = false)
    private String provider;

    // Provider's transaction/payment reference id
    private String providerReference;

    @Column(length = 1000)
    private String failureReason;
}
