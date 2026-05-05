package com.pos.dto.response;

public record ApiResponse<T>(
        T data,
        String message,
        int status
) {
}
