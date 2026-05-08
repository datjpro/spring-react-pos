package com.pos.services;

import com.pos.dtos.request.LoginRequest;
import com.pos.dtos.response.LoginResponse;
import com.pos.dtos.request.RefreshTokenRequest;
import com.pos.dtos.response.RefreshTokenResponse;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    RefreshTokenResponse refresh(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);
}
