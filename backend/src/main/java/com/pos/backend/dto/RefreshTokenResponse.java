package com.pos.backend.dto;

public record RefreshTokenResponse(
        String accessToken,
        long expiresIn
) {
}
