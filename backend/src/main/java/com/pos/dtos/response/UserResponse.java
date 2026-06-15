package com.pos.dtos.response;

import com.pos.common.enums.Role;
import java.time.Instant;

public record UserResponse(
        Long id,
        String username,
        Role role,
        Long branchId,
        String branchName,
        boolean active,
        Instant createdAt
) {
}