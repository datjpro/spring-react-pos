package com.pos.dto.response;

public record RefreshTokenResponse(
        String accessToken,
        long expiresIn
) {
}
