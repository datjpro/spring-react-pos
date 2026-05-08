package com.pos.services;

import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.DuplicateResourceException;
import com.pos.dtos.request.CreateUserRequest;
import com.pos.dtos.request.UpdateUserActiveRequest;
import com.pos.dtos.request.UpdateUserRequest;
import com.pos.dtos.response.UserResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.UserEntity;
import com.pos.repositories.BranchRepository;
import com.pos.repositories.UserRepository;
import com.pos.services.impl.UserAdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceImplTest {
    @Mock private UserRepository userRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private UserAdminServiceImpl service;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        service = new UserAdminServiceImpl(userRepository, branchRepository, passwordEncoder, new UserContextService(userRepository));
        authentication = new UsernamePasswordAuthenticationToken("admin", null);
    }

    @Test
    void shouldFindAllUsersSuccessfully() {
        when(userRepository.findAll()).thenReturn(List.of(buildUser(1L, "admin", Role.ADMIN, null, true)));
        List<UserResponse> responses = service.findAll();
        assertEquals(1, responses.size());
    }

    @Test
    void shouldFindMeSuccessfully() {
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(buildUser(1L, "admin", Role.ADMIN, null, true)));
        UserResponse response = service.findMe(authentication);
        assertEquals("admin", response.username());
    }

    @Test
    void shouldCreateUserSuccessfully() {
        BranchEntity branch = buildBranch();
        when(userRepository.existsByUsernameIgnoreCase("staff01")).thenReturn(false);
        when(branchRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(branch));
        when(passwordEncoder.encode("123456")).thenReturn("ENC");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> {
            UserEntity u = i.getArgument(0);
            u.setId(2L);
            return u;
        });

        UserResponse response = service.create(new CreateUserRequest("staff01", "123456", Role.STAFF, 1L, true));
        assertEquals("staff01", response.username());
        assertEquals(Role.STAFF, response.role());
    }

    @Test
    void shouldRejectDuplicateUsername() {
        when(userRepository.existsByUsernameIgnoreCase("staff01")).thenReturn(true);
        assertThrows(DuplicateResourceException.class, () -> service.create(new CreateUserRequest("staff01", "123456", Role.STAFF, 1L, true)));
    }

    @Test
    void shouldUpdateUserSuccessfully() {
        UserEntity user = buildUser(2L, "staff01", Role.STAFF, buildBranch(), true);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(branchRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(buildBranch()));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> i.getArgument(0));
        UserResponse response = service.update(2L, new UpdateUserRequest(Role.MANAGER, 1L, true));
        assertEquals(Role.MANAGER, response.role());
    }

    @Test
    void shouldUpdateActiveSuccessfully() {
        UserEntity actor = buildUser(1L, "admin", Role.ADMIN, null, true);
        UserEntity target = buildUser(2L, "staff01", Role.STAFF, buildBranch(), true);
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> i.getArgument(0));
        UserResponse response = service.updateActive(2L, new UpdateUserActiveRequest(false), authentication);
        assertFalse(response.active());
    }

    @Test
    void shouldRejectDeactivateCurrentUser() {
        UserEntity actor = buildUser(1L, "admin", Role.ADMIN, null, true);
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(actor));
        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));
        assertThrows(BadRequestException.class, () -> service.updateActive(1L, new UpdateUserActiveRequest(false), authentication));
    }

    private BranchEntity buildBranch() {
        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setCode("CN-01");
        branch.setName("Branch");
        return branch;
    }

    private UserEntity buildUser(Long id, String username, Role role, BranchEntity branch, boolean active) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setUsername(username);
        user.setRole(role);
        user.setBranch(branch);
        user.setActive(active);
        return user;
    }
}
