package com.pos.dtos.response;

import java.math.BigDecimal;
import java.time.Instant;

public record SalesSummaryResponse(
        Instant from,
        Instant to,
        Long branchId,
        String createdBy,
        long totalSales,
        long totalQuantity,
        BigDecimal totalAmount
) {
}