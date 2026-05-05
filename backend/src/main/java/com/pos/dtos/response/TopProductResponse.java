package com.pos.dtos.response;

import java.math.BigDecimal;

public record TopProductResponse(
        Long productId,
        String sku,
        String productName,
        Long totalQuantity,
        BigDecimal totalRevenue
) {
}
