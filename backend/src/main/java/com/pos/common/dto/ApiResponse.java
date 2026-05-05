package com.pos.common.dto;

public record ApiResponse<T>(
        T data,
        String message,
        int status
) {
}
