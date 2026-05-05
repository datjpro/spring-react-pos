package com.pos.dto.response;

import com.pos.common.enums.PaymentMethod;
import com.pos.common.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long orderId,
        String orderCode,
        PaymentMethod paymentMethod,
        String paymentReference,
        PaymentStatus status,
        BigDecimal amountPaid,
        BigDecimal amountReceived,
        BigDecimal changeAmount,
        String note,
        Instant createdAt
) {
}
