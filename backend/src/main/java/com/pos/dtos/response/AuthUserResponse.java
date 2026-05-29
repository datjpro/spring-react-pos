package com.pos.dtos.response;

import com.pos.common.enums.Role;

public record AuthUserResponse(
        Long id,
        String username,
        Role role,
        Long branchId,
        boolean active
) {
}
