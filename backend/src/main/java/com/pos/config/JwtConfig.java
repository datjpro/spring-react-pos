package com.pos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtConfig(
        String secret,
        long accessTokenExpirationMs,
        long refreshTokenExpirationMs
) {
}
