package com.pos.dto.response;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        String error,
        String message,
        List<String> details,
        Instant timestamp,
        String path
) {
}
