package com.pos.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        String sku,
        String name,
        String category,
        BigDecimal price,
        BigDecimal cost,
        Integer stock,
        String unit,
        String barcode,
        String description,
        String imageUrl,
        boolean active,
        Instant createdAt
) {
}
