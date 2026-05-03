package com.pos.auth.service;

import com.pos.auth.dto.LoginRequest;
import com.pos.auth.dto.LoginResponse;
import com.pos.auth.dto.RefreshTokenRequest;
import com.pos.auth.dto.RefreshTokenResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    RefreshTokenResponse refresh(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);
}
