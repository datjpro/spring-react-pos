package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.CancelSaleRequest;
import com.pos.dtos.request.CreateSaleItemRequest;
import com.pos.dtos.request.CreateSaleRequest;
import com.pos.dtos.response.SaleItemResponse;
import com.pos.dtos.response.SaleResponse;
import com.pos.services.SaleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SaleControllerTest {

    @Mock
    private SaleService saleService;

    @InjectMocks
    private SaleController saleController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(saleController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldCreateSaleSuccessfully() throws Exception {
        CreateSaleRequest request = new CreateSaleRequest(1L, List.of(new CreateSaleItemRequest(1L, 2)), "B?n t?i qu?y");
        when(saleService.create(any(CreateSaleRequest.class), any())).thenReturn(buildResponse(1L, "SAL-1", "COMPLETED"));

        mockMvc.perform(post("/api/v1/sales")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldFindAllSalesSuccessfully() throws Exception {
        when(saleService.findAll()).thenReturn(List.of(buildResponse(1L, "SAL-1", "COMPLETED")));

        mockMvc.perform(get("/api/v1/sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].saleCode").value("SAL-1"));
    }

    @Test
    void shouldFindSaleByIdSuccessfully() throws Exception {
        when(saleService.findById(eq(1L), any())).thenReturn(buildResponse(1L, "SAL-1", "COMPLETED"));

        mockMvc.perform(get("/api/v1/sales/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldReturnNotFoundWhenSaleMissing() throws Exception {
        when(saleService.findById(eq(99L), any())).thenThrow(new ResourceNotFoundException("Sale not found"));

        mockMvc.perform(get("/api/v1/sales/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void shouldCancelSaleSuccessfully() throws Exception {
        CancelSaleRequest request = new CancelSaleRequest("H?y h?a ??n l?i");
        when(saleService.cancel(eq(1L), any(CancelSaleRequest.class), any())).thenReturn(buildResponse(1L, "SAL-1", "CANCELLED"));

        mockMvc.perform(post("/api/v1/sales/1/cancel")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    private SaleResponse buildResponse(Long id, String code, String status) {
        return new SaleResponse(
                id,
                code,
                1L,
                "Branch",
                com.pos.common.enums.SaleStatus.valueOf(status),
                new BigDecimal("50000"),
                List.of(new SaleItemResponse(1L, "Coffee", 2, new BigDecimal("25000"), new BigDecimal("50000"))),
                "admin",
                Instant.now()
        );
    }
}
