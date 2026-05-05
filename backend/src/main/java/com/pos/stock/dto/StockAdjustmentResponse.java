package com.pos.stock.dto;

public record StockAdjustmentResponse(Long productId, Long branchId, Integer quantityDelta, Integer currentStock, String reason, String actor) { }
