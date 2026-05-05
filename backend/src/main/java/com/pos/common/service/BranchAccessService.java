package com.pos.common.service;

import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.user.entity.UserEntity;
import org.springframework.stereotype.Service;

@Service
public class BranchAccessService {

    public void requireBranchAccess(UserEntity user, Long branchId) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getBranch() == null || user.getBranch().getId() == null) {
            throw new BadRequestException("User branch scope is required");
        }
        if (!user.getBranch().getId().equals(branchId)) {
            throw new BadRequestException("User is not allowed to access this branch");
        }
    }
}
