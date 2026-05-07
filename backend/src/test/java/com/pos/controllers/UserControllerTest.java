package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.enums.Role;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.dtos.request.CreateUserRequest;
import com.pos.dtos.request.UpdateUserActiveRequest;
import com.pos.dtos.request.UpdateUserRequest;
import com.pos.dtos.response.UserResponse;
import com.pos.services.UserAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {
    @Mock private UserAdminService userAdminService;
    @InjectMocks private UserController userController;
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(userController).setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void shouldFindAllUsersSuccessfully() throws Exception {
        when(userAdminService.findAll()).thenReturn(List.of(buildResponse(1L, "admin", Role.ADMIN, null, null, true)));
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"));
    }

    @Test
    void shouldFindMeSuccessfully() throws Exception {
        when(userAdminService.findMe(any())).thenReturn(buildResponse(1L, "admin", Role.ADMIN, null, null, true));
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void shouldCreateUserSuccessfully() throws Exception {
        CreateUserRequest request = new CreateUserRequest("staff01", "123456", Role.STAFF, 1L, true);
        when(userAdminService.create(any(CreateUserRequest.class))).thenReturn(buildResponse(2L, "staff01", Role.STAFF, 1L, "Branch", true));
        mockMvc.perform(post("/api/v1/users").contentType(APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("staff01"));
    }

    @Test
    void shouldUpdateUserSuccessfully() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest(Role.MANAGER, 1L, true);
        when(userAdminService.update(eq(2L), any(UpdateUserRequest.class))).thenReturn(buildResponse(2L, "staff01", Role.MANAGER, 1L, "Branch", true));
        mockMvc.perform(put("/api/v1/users/2").contentType(APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));
    }

    @Test
    void shouldUpdateActiveSuccessfully() throws Exception {
        UpdateUserActiveRequest request = new UpdateUserActiveRequest(false);
        when(userAdminService.updateActive(eq(2L), any(UpdateUserActiveRequest.class), any())).thenReturn(buildResponse(2L, "staff01", Role.STAFF, 1L, "Branch", false));
        mockMvc.perform(patch("/api/v1/users/2/active").contentType(APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    private UserResponse buildResponse(Long id, String username, Role role, Long branchId, String branchName, boolean active) {
        return new UserResponse(id, username, role, branchId, branchName, active, Instant.now());
    }
}
