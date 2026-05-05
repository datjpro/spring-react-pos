package com.pos.sale.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CreateSaleRequest(@NotNull @Min(1) Long branchId, @NotEmpty List<@Valid CreateSaleItemRequest> items, @Size(max = 500) String note) { }
