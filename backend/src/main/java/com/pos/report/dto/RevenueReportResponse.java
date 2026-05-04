package com.pos.report.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RevenueReportResponse(
        Instant from,
        Instant to,
        String groupBy,
        BigDecimal totalRevenue,
        Long totalOrders,
        List<RevenueDataPoint> data
) {
}
