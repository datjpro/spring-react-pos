package com.pos.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueDataPoint(
        LocalDate date,
        BigDecimal revenue,
        Long orderCount
) {
}
