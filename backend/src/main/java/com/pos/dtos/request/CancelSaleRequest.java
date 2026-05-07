package com.pos.dtos.request;

import jakarta.validation.constraints.Size;

public record CancelSaleRequest(
        @Size(max = 500, message = "reason must be at most 500 characters")
        String reason
) {
}