package com.pos.backend.dto;

import com.pos.backend.entity.InventoryAdjustmentType;

import java.time.Instant;

public record InventoryAdjustmentResponse(
        Long id,
        Long productId,
        String productName,
        InventoryAdjustmentType adjustmentType,
        Integer quantity,
        String reason,
        String note,
        Integer currentStock,
        String createdBy,
        Instant createdAt
) {
}
