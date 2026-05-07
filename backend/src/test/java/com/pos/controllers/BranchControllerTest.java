package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.BranchRequest;
import com.pos.dtos.response.BranchResponse;
import com.pos.services.BranchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BranchControllerTest {

    @Mock
    private BranchService branchService;

    @InjectMocks
    private BranchController branchController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(branchController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldFindAllBranchesSuccessfully() throws Exception {
        when(branchService.findAll()).thenReturn(List.of(new BranchResponse(1L, "CN-01", "Main", "Address", true)));

        mockMvc.perform(get("/api/v1/branches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void shouldFindBranchByIdSuccessfully() throws Exception {
        when(branchService.findById(1L)).thenReturn(new BranchResponse(1L, "CN-01", "Main", "Address", true));

        mockMvc.perform(get("/api/v1/branches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("CN-01"));
    }

    @Test
    void shouldReturnNotFoundWhenBranchMissing() throws Exception {
        when(branchService.findById(99L)).thenThrow(new ResourceNotFoundException("Branch not found"));

        mockMvc.perform(get("/api/v1/branches/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void shouldCreateBranchSuccessfully() throws Exception {
        BranchRequest request = new BranchRequest("CN-01", "Main", "Address");
        when(branchService.create(any(BranchRequest.class))).thenReturn(new BranchResponse(1L, "CN-01", "Main", "Address", true));

        mockMvc.perform(post("/api/v1/branches")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldUpdateBranchSuccessfully() throws Exception {
        BranchRequest request = new BranchRequest("CN-01", "Updated", "Address");
        when(branchService.update(1L, request)).thenReturn(new BranchResponse(1L, "CN-01", "Updated", "Address", true));

        mockMvc.perform(put("/api/v1/branches/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    void shouldDeleteBranchSuccessfully() throws Exception {
        doNothing().when(branchService).delete(1L);

        mockMvc.perform(delete("/api/v1/branches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted branch"));
    }
}
