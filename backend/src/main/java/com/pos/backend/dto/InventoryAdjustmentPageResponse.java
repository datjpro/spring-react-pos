package com.pos.backend.dto;

import java.util.List;

public record InventoryAdjustmentPageResponse(
        List<InventoryAdjustmentResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
