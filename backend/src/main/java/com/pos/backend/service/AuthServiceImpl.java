package com.pos.backend.service;

import com.pos.backend.config.SecurityProperties;
import com.pos.backend.dto.LoginRequest;
import com.pos.backend.dto.LoginResponse;
import com.pos.backend.dto.RefreshTokenRequest;
import com.pos.backend.dto.RefreshTokenResponse;
import com.pos.backend.entity.RefreshTokenEntity;
import com.pos.backend.entity.UserEntity;
import com.pos.backend.exception.UnauthorizedException;
import com.pos.backend.repository.RefreshTokenRepository;
import com.pos.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final SecurityProperties securityProperties;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           JwtService jwtService,
                           SecurityProperties securityProperties) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.securityProperties = securityProperties;
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.username(), loginRequest.password())
        );

        String username = authentication.getName();
        UserEntity userEntity = userRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        String accessToken = jwtService.generateAccessToken(userEntity.getUsername(), userEntity.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(userEntity.getUsername());

        refreshTokenRepository.deleteByUser(userEntity);

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(userEntity);
        refreshTokenEntity.setExpiryAt(Instant.now().plusMillis(securityProperties.refreshTokenExpirationMs()));
        refreshTokenEntity.setRevoked(false);
        refreshTokenRepository.save(refreshTokenEntity);

        return new LoginResponse(accessToken, refreshToken, "Bearer", securityProperties.accessTokenExpirationMs() / 1000);
    }

    @Override
    public RefreshTokenResponse refresh(RefreshTokenRequest refreshTokenRequest) {
        RefreshTokenEntity refreshTokenEntity = refreshTokenRepository.findByToken(refreshTokenRequest.refreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));

        if (refreshTokenEntity.isRevoked() || refreshTokenEntity.getExpiryAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        try {
            Claims claims = jwtService.extractClaims(refreshTokenEntity.getToken());
            String username = claims.getSubject();
            String accessToken = jwtService.generateAccessToken(username, refreshTokenEntity.getUser().getRole().name());
            return new RefreshTokenResponse(accessToken, securityProperties.accessTokenExpirationMs() / 1000);
        } catch (JwtException jwtException) {
            throw new UnauthorizedException("Refresh token is invalid");
        }
    }

    @Override
    @Transactional
    public void logout(String username) {
        UserEntity userEntity = userRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        refreshTokenRepository.deleteByUser(userEntity);
    }
}
