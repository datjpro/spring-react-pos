package com.pos.dto.response;

import jakarta.validation.constraints.NotBlank;

public record TestValidationRequest(
        @NotBlank(message = "name must not be blank")
        String name
) {
}
