package com.pos.dtos.request;

import com.pos.common.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotNull Role role,
        Long branchId,
        Boolean active
) {
}