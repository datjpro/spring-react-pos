package com.pos.auth.dto;

public record RefreshTokenResponse(
        String accessToken,
        long expiresIn
) {
}
