package com.pos.dtos.response;

import com.pos.common.enums.MovementType;

import java.time.Instant;

public record StockCardEntryResponse(
        Long id,
        Instant createdAt,
        MovementType movementType,
        Integer quantity,
        String referenceType,
        Long referenceId,
        String note,
        String createdBy
) {
}