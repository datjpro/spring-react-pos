package com.pos.backend.service;

import com.pos.backend.dto.LoginRequest;
import com.pos.backend.dto.LoginResponse;
import com.pos.backend.dto.RefreshTokenRequest;
import com.pos.backend.dto.RefreshTokenResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    RefreshTokenResponse refresh(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);
}
