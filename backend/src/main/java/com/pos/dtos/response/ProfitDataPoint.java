package com.pos.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfitDataPoint(LocalDate period, BigDecimal revenue, BigDecimal cost, BigDecimal profit) {
}