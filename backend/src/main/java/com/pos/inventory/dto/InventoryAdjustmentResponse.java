package com.pos.inventory.dto;

import com.pos.common.enums.AdjustmentType;

import java.time.Instant;

public record InventoryAdjustmentResponse(
        Long id,
        Long productId,
        String productName,
        AdjustmentType adjustmentType,
        Integer quantity,
        String reason,
        String note,
        Integer currentStock,
        String createdBy,
        Instant createdAt
) {
}
