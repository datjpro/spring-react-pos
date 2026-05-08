package com.pos.controllers;

import com.pos.dtos.request.CreateUserRequest;
import com.pos.dtos.request.UpdateUserActiveRequest;
import com.pos.dtos.request.UpdateUserRequest;
import com.pos.dtos.response.UserResponse;
import com.pos.services.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User administration and current profile")
public class UserController {
    private final UserAdminService userAdminService;

    public UserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Operation(summary = "List users", description = "Admin-only user list")
    public ResponseEntity<List<UserResponse>> findAll() { return ResponseEntity.ok(userAdminService.findAll()); }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Return profile of authenticated user")
    public ResponseEntity<UserResponse> findMe(Authentication authentication) { return ResponseEntity.ok(userAdminService.findMe(authentication)); }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @Operation(summary = "Create user", description = "Admin-only user creation")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(userAdminService.create(request)); }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Admin-only role/branch/active update")
    public ResponseEntity<UserResponse> update(@PathVariable @Min(1) Long id, @Valid @RequestBody UpdateUserRequest request) { return ResponseEntity.ok(userAdminService.update(id, request)); }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/active")
    @Operation(summary = "Update user active state", description = "Admin-only activate/deactivate user")
    public ResponseEntity<UserResponse> updateActive(@PathVariable @Min(1) Long id, @Valid @RequestBody UpdateUserActiveRequest request, Authentication authentication) { return ResponseEntity.ok(userAdminService.updateActive(id, request, authentication)); }
}
