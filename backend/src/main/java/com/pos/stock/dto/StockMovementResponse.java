package com.pos.stock.dto;

import com.pos.common.enums.MovementType;
import java.time.Instant;

public record StockMovementResponse(Long id, Long productId, String productName, Long branchId, String branchName, MovementType movementType, Integer quantity, String referenceType, Long referenceId, String note, String createdBy, Instant createdAt) { }
