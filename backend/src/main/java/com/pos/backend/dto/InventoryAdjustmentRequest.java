package com.pos.backend.dto;

import com.pos.backend.entity.InventoryAdjustmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(
        @NotNull(message = "productId must not be null")
        Long productId,

        @NotNull(message = "adjustmentType must not be null")
        InventoryAdjustmentType adjustmentType,

        @NotNull(message = "quantity must not be null")
        @Positive(message = "quantity must be greater than 0")
        Integer quantity,

        @NotBlank(message = "reason must not be blank")
        @Size(max = 255, message = "reason must be at most 255 characters")
        String reason,

        @Size(max = 500, message = "note must be at most 500 characters")
        String note
) {
}
