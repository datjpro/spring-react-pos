package com.pos.dtos.request;

import jakarta.validation.constraints.NotNull;

public record UpdateUserActiveRequest(
        @NotNull Boolean active
) {
}