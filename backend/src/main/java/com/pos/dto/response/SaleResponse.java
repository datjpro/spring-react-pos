package com.pos.dto.response;

import com.pos.common.enums.SaleStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SaleResponse(Long id, String saleCode, Long branchId, String branchName, SaleStatus status, BigDecimal totalAmount, List<SaleItemResponse> items, String createdBy, Instant createdAt) { }
