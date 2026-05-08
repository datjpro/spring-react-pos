package com.pos.dtos.response;

public record LowStockProductResponse(
        Long productId,
        String sku,
        String name,
        Integer stock,
        Integer threshold,
        String status
) {
}
