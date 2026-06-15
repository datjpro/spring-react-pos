package com.pos.security;

import com.pos.entities.BranchEntity;
import com.pos.common.enums.Role;
import org.springframework.security.access.AccessDeniedException;
import com.pos.entities.UserEntity;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BranchAccessGuardTest {

    private final BranchAccessGuard branchAccessService = new BranchAccessGuard();

    @Test
    void shouldAllowAdminAccessAnyBranch() {
        UserEntity user = new UserEntity();
        user.setRole(Role.ADMIN);
        assertDoesNotThrow(() -> branchAccessService.requireBranchAccess(user, 99L));
    }

    @Test
    void shouldRejectUserWithoutBranchScope() {
        UserEntity user = new UserEntity();
        user.setRole(Role.MANAGER);
        assertThrows(AccessDeniedException.class, () -> branchAccessService.requireBranchAccess(user, 1L));
    }

    @Test
    void shouldRejectCrossBranchAccess() {
        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        UserEntity user = new UserEntity();
        user.setRole(Role.STAFF);
        user.setBranch(branch);
        assertThrows(AccessDeniedException.class, () -> branchAccessService.requireBranchAccess(user, 2L));
    }
}

