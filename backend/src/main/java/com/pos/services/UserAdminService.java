package com.pos.services;

import com.pos.dtos.request.CreateUserRequest;
import com.pos.dtos.request.UpdateUserActiveRequest;
import com.pos.dtos.request.UpdateUserRequest;
import com.pos.dtos.response.UserResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface UserAdminService {
    List<UserResponse> findAll();

    UserResponse findMe(Authentication authentication);

    UserResponse create(CreateUserRequest request);

    UserResponse update(Long id, UpdateUserRequest request);

    UserResponse updateActive(Long id, UpdateUserActiveRequest request, Authentication authentication);
}