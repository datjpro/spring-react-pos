package com.pos.common.service;

import com.pos.branch.entity.BranchEntity;
import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.user.entity.UserEntity;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BranchAccessServiceTest {

    private final BranchAccessService branchAccessService = new BranchAccessService();

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
        assertThrows(BadRequestException.class, () -> branchAccessService.requireBranchAccess(user, 1L));
    }

    @Test
    void shouldRejectCrossBranchAccess() {
        BranchEntity branch = new BranchEntity();
        try {
            var field = BranchEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(branch, 1L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        UserEntity user = new UserEntity();
        user.setRole(Role.STAFF);
        user.setBranch(branch);
        assertThrows(BadRequestException.class, () -> branchAccessService.requireBranchAccess(user, 2L));
    }
}
