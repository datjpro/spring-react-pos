package com.pos.dtos.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PurchaseSummaryResponse(
        Instant from,
        Instant to,
        Long supplierId,
        Long branchId,
        long totalPurchases,
        long totalQuantity,
        BigDecimal totalAmount
) {
}