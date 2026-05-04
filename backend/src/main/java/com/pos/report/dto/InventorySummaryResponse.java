package com.pos.report.dto;

public record InventorySummaryResponse(
        Long totalProducts,
        Long activeProducts,
        Long totalStock,
        Long lowStockProducts,
        Long outOfStockProducts
) {
}
