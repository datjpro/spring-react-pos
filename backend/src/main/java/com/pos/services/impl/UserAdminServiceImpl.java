package com.pos.services.impl;

import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.DuplicateResourceException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.CreateUserRequest;
import com.pos.dtos.request.UpdateUserActiveRequest;
import com.pos.dtos.request.UpdateUserRequest;
import com.pos.dtos.response.UserResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.UserEntity;
import com.pos.repositories.BranchRepository;
import com.pos.repositories.UserRepository;
import com.pos.services.UserAdminService;
import com.pos.services.UserContextService;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserAdminServiceImpl implements UserAdminService {
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserContextService userContextService;

    public UserAdminServiceImpl(UserRepository userRepository, BranchRepository branchRepository, PasswordEncoder passwordEncoder, UserContextService userContextService) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.userContextService = userContextService;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::map).toList();
    }

    public UserResponse findMe(Authentication authentication) {
        return map(userContextService.requireUser(authentication));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new DuplicateResourceException("Username already exists");
        }
        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setActive(request.active() == null || request.active());
        user.setBranch(resolveBranch(request.role(), request.branchId()));
        return map(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        UserEntity user = find(id);
        user.setRole(request.role());
        user.setActive(request.active() == null || request.active());
        user.setBranch(resolveBranch(request.role(), request.branchId()));
        return map(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateActive(Long id, UpdateUserActiveRequest request, Authentication authentication) {
        UserEntity actor = userContextService.requireUser(authentication);
        UserEntity user = find(id);
        if (actor.getId() != null && actor.getId().equals(user.getId()) && Boolean.FALSE.equals(request.active())) {
            throw new BadRequestException("Cannot deactivate current user");
        }
        user.setActive(request.active());
        return map(userRepository.save(user));
    }

    private UserEntity find(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private BranchEntity resolveBranch(Role role, Long branchId) {
        if (role == Role.ADMIN) {
            return null;
        }
        if (branchId == null) {
            throw new BadRequestException("branchId is required for non-admin user");
        }
        return branchRepository.findByIdAndActiveTrue(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
    }

    private UserResponse map(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getBranch() == null ? null : user.getBranch().getId(),
                user.getBranch() == null ? null : user.getBranch().getName(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
