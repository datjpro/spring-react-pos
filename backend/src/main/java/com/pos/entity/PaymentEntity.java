package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.base.BaseEntity;

import com.pos.common.enums.PaymentMethod;
import com.pos.common.enums.PaymentStatus;
import com.pos.entity.OrderEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Table(name = "payments")
public class PaymentEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "amount_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "amount_received", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountReceived;

    @Column(name = "change_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal changeAmount;

    @Column(name = "note", length = 255)
    private String note;





}
