package com.pos.sale.dto;

import jakarta.validation.constraints.*;

public record CreateSaleItemRequest(@NotNull @Min(1) Long productId, @NotNull @Min(1) Integer quantity) { }
