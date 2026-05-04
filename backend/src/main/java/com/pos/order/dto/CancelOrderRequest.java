package com.pos.order.dto;

import jakarta.validation.constraints.Size;

public record CancelOrderRequest(
        @Size(max = 255, message = "reason must be at most 255 characters")
        String reason
) {
}
