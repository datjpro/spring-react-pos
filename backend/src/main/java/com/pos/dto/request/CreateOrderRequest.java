package com.pos.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotEmpty(message = "items must not be empty")
        List<@Valid CreateOrderItemRequest> items,

        @PositiveOrZero(message = "discountAmount must be greater than or equal to 0")
        BigDecimal discountAmount
) {
}
