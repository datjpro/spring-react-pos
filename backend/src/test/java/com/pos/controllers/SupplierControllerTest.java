package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.SupplierRequest;
import com.pos.dtos.response.SupplierResponse;
import com.pos.services.SupplierService;
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
class SupplierControllerTest {

    @Mock
    private SupplierService supplierService;

    @InjectMocks
    private SupplierController supplierController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(supplierController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldFindAllSuppliersSuccessfully() throws Exception {
        when(supplierService.findAll()).thenReturn(List.of(new SupplierResponse(1L, "NCC-01", "Supplier", "090", "s@example.com", "Address", true)));

        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void shouldFindSupplierByIdSuccessfully() throws Exception {
        when(supplierService.findById(1L)).thenReturn(new SupplierResponse(1L, "NCC-01", "Supplier", "090", "s@example.com", "Address", true));

        mockMvc.perform(get("/api/v1/suppliers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("NCC-01"));
    }

    @Test
    void shouldReturnNotFoundWhenSupplierMissing() throws Exception {
        when(supplierService.findById(99L)).thenThrow(new ResourceNotFoundException("Supplier not found"));

        mockMvc.perform(get("/api/v1/suppliers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void shouldCreateSupplierSuccessfully() throws Exception {
        SupplierRequest request = new SupplierRequest("NCC-01", "Supplier", "090", "s@example.com", "Address");
        when(supplierService.create(any(SupplierRequest.class))).thenReturn(new SupplierResponse(1L, "NCC-01", "Supplier", "090", "s@example.com", "Address", true));

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldUpdateSupplierSuccessfully() throws Exception {
        SupplierRequest request = new SupplierRequest("NCC-01", "Updated", "090", "s@example.com", "Address");
        when(supplierService.update(1L, request)).thenReturn(new SupplierResponse(1L, "NCC-01", "Updated", "090", "s@example.com", "Address", true));

        mockMvc.perform(put("/api/v1/suppliers/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    void shouldDeleteSupplierSuccessfully() throws Exception {
        doNothing().when(supplierService).delete(1L);

        mockMvc.perform(delete("/api/v1/suppliers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted supplier"));
    }
}
