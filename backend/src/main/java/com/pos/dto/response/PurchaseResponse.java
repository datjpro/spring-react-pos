package com.pos.dto.response;

import com.pos.common.enums.PurchaseStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PurchaseResponse(Long id, String purchaseCode, Long supplierId, String supplierName, Long branchId, String branchName, PurchaseStatus status, BigDecimal totalAmount, List<PurchaseItemResponse> items, String createdBy, Instant createdAt) { }
