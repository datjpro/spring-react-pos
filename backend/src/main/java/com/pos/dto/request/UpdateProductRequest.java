package com.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateProductRequest(
        @NotBlank(message = "name must not be blank")
        @Size(max = 255, message = "name must be at most 255 characters")
        String name,

        @Size(max = 100, message = "category must be at most 100 characters")
        String category,

        @NotNull(message = "price must not be null")
        @PositiveOrZero(message = "price must be greater than or equal to 0")
        BigDecimal price,

        @PositiveOrZero(message = "cost must be greater than or equal to 0")
        BigDecimal cost,

        @NotNull(message = "stock must not be null")
        @PositiveOrZero(message = "stock must be greater than or equal to 0")
        Integer stock,

        @NotBlank(message = "unit must not be blank")
        @Size(max = 50, message = "unit must be at most 50 characters")
        String unit,

        @Size(max = 100, message = "barcode must be at most 100 characters")
        String barcode,

        String description,

        @Size(max = 500, message = "imageUrl must be at most 500 characters")
        String imageUrl,

        boolean active
) {
}
