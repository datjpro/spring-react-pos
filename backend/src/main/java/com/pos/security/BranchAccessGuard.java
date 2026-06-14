package com.pos.security;

import com.pos.common.enums.Role;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import com.pos.entities.UserEntity;

@Service
public class BranchAccessGuard {

    public void requireBranchAccess(UserEntity user, Long branchId) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getBranch() == null || user.getBranch().getId() == null) {
            throw new AccessDeniedException("User branch scope is required");
        }
        if (!user.getBranch().getId().equals(branchId)) {
            throw new AccessDeniedException("User is not allowed to access this branch");
        }
    }
}

