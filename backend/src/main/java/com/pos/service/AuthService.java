package com.pos.service;

import com.pos.dto.request.LoginRequest;
import com.pos.dto.response.LoginResponse;
import com.pos.dto.request.RefreshTokenRequest;
import com.pos.dto.response.RefreshTokenResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    RefreshTokenResponse refresh(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);
}
