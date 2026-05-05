package com.pos.dto;

import jakarta.validation.constraints.NotBlank;

public record TestValidationRequest(
        @NotBlank(message = "name must not be blank")
        String name
) {
}
