package com.pos.dtos.response;

import java.util.List;

public record StockLevelPageResponse(
        List<StockLevelResponse> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
}
