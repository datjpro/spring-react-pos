package com.pos.dtos.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProfitReportResponse(
        Instant from,
        Instant to,
        String groupBy,
        BigDecimal totalRevenue,
        BigDecimal totalCost,
        BigDecimal totalProfit,
        List<ProfitDataPoint> dataPoints
) {
}