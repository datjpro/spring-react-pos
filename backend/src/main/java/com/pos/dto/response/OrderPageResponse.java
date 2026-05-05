package com.pos.dto.response;

import java.util.List;

public record OrderPageResponse(
        List<OrderResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
