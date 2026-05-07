package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.CancelPurchaseRequest;
import com.pos.dtos.request.CreatePurchaseItemRequest;
import com.pos.dtos.request.CreatePurchaseRequest;
import com.pos.dtos.response.PurchaseItemResponse;
import com.pos.dtos.response.PurchaseResponse;
import com.pos.services.PurchaseService;
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
class PurchaseControllerTest {

    @Mock
    private PurchaseService purchaseService;

    @InjectMocks
    private PurchaseController purchaseController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(purchaseController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldCreatePurchaseSuccessfully() throws Exception {
        CreatePurchaseRequest request = new CreatePurchaseRequest(
                1L,
                1L,
                List.of(new CreatePurchaseItemRequest(1L, 5, new BigDecimal("18000"))),
                "Nh?p kho"
        );

        PurchaseResponse response = buildResponse(1L, "PUR-1", "CONFIRMED");

        when(purchaseService.create(any(CreatePurchaseRequest.class), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/purchases")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldFindAllPurchasesSuccessfully() throws Exception {
        when(purchaseService.findAll()).thenReturn(List.of(buildResponse(1L, "PUR-1", "CONFIRMED")));

        mockMvc.perform(get("/api/v1/purchases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].purchaseCode").value("PUR-1"));
    }

    @Test
    void shouldFindPurchaseByIdSuccessfully() throws Exception {
        when(purchaseService.findById(eq(1L), any())).thenReturn(buildResponse(1L, "PUR-1", "CONFIRMED"));

        mockMvc.perform(get("/api/v1/purchases/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldReturnNotFoundWhenPurchaseMissing() throws Exception {
        when(purchaseService.findById(eq(99L), any())).thenThrow(new ResourceNotFoundException("Purchase not found"));

        mockMvc.perform(get("/api/v1/purchases/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void shouldCancelPurchaseSuccessfully() throws Exception {
        CancelPurchaseRequest request = new CancelPurchaseRequest("H?y phi?u nh?p l?i");
        when(purchaseService.cancel(eq(1L), any(CancelPurchaseRequest.class), any()))
                .thenReturn(buildResponse(1L, "PUR-1", "CANCELLED"));

        mockMvc.perform(post("/api/v1/purchases/1/cancel")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    private PurchaseResponse buildResponse(Long id, String code, String status) {
        return new PurchaseResponse(
                id,
                code,
                1L,
                "Supplier",
                1L,
                "Branch",
                com.pos.common.enums.PurchaseStatus.valueOf(status),
                new BigDecimal("90000"),
                List.of(new PurchaseItemResponse(1L, "Coffee", 5, new BigDecimal("18000"), new BigDecimal("90000"))),
                "admin",
                Instant.now()
        );
    }
}
