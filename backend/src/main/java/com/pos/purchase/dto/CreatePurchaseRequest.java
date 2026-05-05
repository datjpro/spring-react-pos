package com.pos.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CreatePurchaseRequest(@NotNull @Min(1) Long supplierId, @NotNull @Min(1) Long branchId, @NotEmpty List<@Valid CreatePurchaseItemRequest> items, @Size(max = 500) String note) { }
