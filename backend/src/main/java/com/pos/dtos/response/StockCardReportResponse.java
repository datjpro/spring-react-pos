package com.pos.dtos.response;

import java.time.Instant;
import java.util.List;

public record StockCardReportResponse(
        Long productId,
        Long branchId,
        Instant from,
        Instant to,
        List<StockCardEntryResponse> entries
) {
}