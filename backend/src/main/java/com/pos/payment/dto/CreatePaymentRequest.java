package com.pos.payment.dto;

import com.pos.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotNull(message = "orderId must not be null")
        Long orderId,

        @NotNull(message = "paymentMethod must not be null")
        PaymentMethod paymentMethod,

        @NotNull(message = "amountReceived must not be null")
        @PositiveOrZero(message = "amountReceived must be greater than or equal to 0")
        BigDecimal amountReceived,

        @Size(max = 255, message = "note must be at most 255 characters")
        String note
) {
}
