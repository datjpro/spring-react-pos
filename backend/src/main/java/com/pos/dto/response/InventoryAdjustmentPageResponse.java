package com.pos.dto.response;

import java.util.List;

public record InventoryAdjustmentPageResponse(
        List<InventoryAdjustmentResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
