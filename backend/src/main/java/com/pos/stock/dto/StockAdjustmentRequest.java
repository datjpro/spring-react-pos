package com.pos.stock.dto;

import jakarta.validation.constraints.*;

public record StockAdjustmentRequest(@NotNull @Min(1) Long productId, @NotNull @Min(1) Long branchId, @NotNull Integer quantityDelta, @NotBlank @Size(max = 255) String reason, @Size(max = 500) String note) { }
