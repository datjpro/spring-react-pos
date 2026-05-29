package com.pos.services;

import com.pos.services.impl.AuthServiceImpl;

import com.pos.config.JwtConfig;
import com.pos.dtos.request.LoginRequest;
import com.pos.dtos.response.LoginResponse;
import com.pos.dtos.request.RefreshTokenRequest;
import com.pos.dtos.response.RefreshTokenResponse;
import com.pos.entities.RefreshTokenEntity;
import com.pos.common.enums.Role;
import com.pos.entities.UserEntity;
import com.pos.common.exception.UnauthorizedException;
import com.pos.security.JwtTokenProvider;
import com.pos.repositories.RefreshTokenRepository;
import com.pos.repositories.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private JwtConfig jwtConfig;
    private JwtTokenProvider jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        jwtConfig = new JwtConfig(
                "0123456789012345678901234567890101234567890123456789012345678901",
                3600000,
                604800000
        );
        jwtService = new JwtTokenProvider(jwtConfig);
        authService = new AuthServiceImpl(authenticationManager, userRepository, refreshTokenRepository, jwtService, jwtConfig);
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest loginRequest = new LoginRequest("admin", "123456");
        Authentication authentication = new UsernamePasswordAuthenticationToken("admin", "123456");

        UserEntity userEntity = new UserEntity();
        userEntity.setUsername("admin");
        userEntity.setRole(Role.ADMIN);
        userEntity.setPassword("encoded-password");
        userEntity.setActive(true);

        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(authentication);
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(userEntity));

        LoginResponse loginResponse = authService.login(loginRequest);

        assertNotNull(loginResponse.accessToken());
        assertNotNull(loginResponse.refreshToken());
        assertEquals("Bearer", loginResponse.tokenType());
        assertEquals("admin", loginResponse.user().username());
        assertEquals(Role.ADMIN, loginResponse.user().role());
        verify(refreshTokenRepository).deleteByUser(userEntity);
        verify(refreshTokenRepository).save(any(RefreshTokenEntity.class));
    }

    @Test
    void shouldThrowUnauthorizedWhenRefreshTokenIsRevoked() {
        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setToken("revoked-token");
        refreshTokenEntity.setRevoked(true);
        refreshTokenEntity.setExpiryAt(Instant.now().plusSeconds(3600));

        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(refreshTokenEntity));

        assertThrows(UnauthorizedException.class, () -> authService.refresh(new RefreshTokenRequest("revoked-token")));
    }

    @Test
    void shouldRefreshTokenSuccessfully() {
        UserEntity userEntity = new UserEntity();
        userEntity.setUsername("manager");
        userEntity.setRole(Role.MANAGER);
        userEntity.setActive(true);

        String refreshToken = Jwts.builder()
                .subject("manager")
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtConfig.secret().getBytes(StandardCharsets.UTF_8)))
                .compact();

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(userEntity);
        refreshTokenEntity.setExpiryAt(Instant.now().plusSeconds(3600));
        refreshTokenEntity.setRevoked(false);

        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.of(refreshTokenEntity));

        RefreshTokenResponse refreshTokenResponse = authService.refresh(new RefreshTokenRequest(refreshToken));
        assertNotNull(refreshTokenResponse.accessToken());
        assertEquals(3600, refreshTokenResponse.expiresIn());
        assertEquals("manager", refreshTokenResponse.user().username());
        assertEquals(Role.MANAGER, refreshTokenResponse.user().role());
    }
}
