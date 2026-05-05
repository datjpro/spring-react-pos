package com.pos.dtos.response;

import java.util.List;

public record ProductPageResponse(
        List<ProductResponse> content,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
