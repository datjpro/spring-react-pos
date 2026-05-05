package com.pos.dto.response;

public record InventorySummaryResponse(
        Long totalProducts,
        Long activeProducts,
        Long totalStock,
        Long lowStockProducts,
        Long outOfStockProducts
) {
}
