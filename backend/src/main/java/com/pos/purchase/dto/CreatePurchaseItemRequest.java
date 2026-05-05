package com.pos.purchase.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreatePurchaseItemRequest(@NotNull @Min(1) Long productId, @NotNull @Min(1) Integer quantity, @NotNull @DecimalMin("0.0") BigDecimal unitCost) { }
