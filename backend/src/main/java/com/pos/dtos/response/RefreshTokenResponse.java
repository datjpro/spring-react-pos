package com.pos.dtos.response;

public record RefreshTokenResponse(
        String accessToken,
        long expiresIn,
        AuthUserResponse user
) {
}
