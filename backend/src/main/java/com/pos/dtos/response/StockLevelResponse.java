package com.pos.dtos.response;

public record StockLevelResponse(
        Long productId,
        String productName,
        String sku,
        Long branchId,
        String branchName,
        Integer stock
) {
}
