package com.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderItemRequest(
        @NotNull(message = "productId must not be null")
        Long productId,

        @NotNull(message = "quantity must not be null")
        @Positive(message = "quantity must be greater than 0")
        Integer quantity
) {
}
