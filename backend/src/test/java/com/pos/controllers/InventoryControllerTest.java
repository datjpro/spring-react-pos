package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dtos.response.InventoryAdjustmentPageResponse;
import com.pos.dtos.request.InventoryAdjustmentRequest;
import com.pos.dtos.response.InventoryAdjustmentResponse;
import com.pos.dtos.response.LowStockProductResponse;
import com.pos.common.enums.AdjustmentType;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.services.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
class InventoryControllerTest {

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldAdjustInventorySuccessfully() throws Exception {
        Authentication authentication = new UsernamePasswordAuthenticationToken("admin", null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        InventoryAdjustmentRequest inventoryAdjustmentRequest = new InventoryAdjustmentRequest(
                1L, AdjustmentType.INCREASE, 10, "Restock", "note"
        );
        InventoryAdjustmentResponse inventoryAdjustmentResponse = new InventoryAdjustmentResponse(
                1L, 1L, "Coffee", AdjustmentType.INCREASE, 10, "Restock", "note",
                20, "admin", Instant.now()
        );

        when(inventoryService.adjustInventory(any(InventoryAdjustmentRequest.class), eq("admin")))
                .thenReturn(inventoryAdjustmentResponse);

        mockMvc.perform(post("/api/v1/inventory/adjustments")
                        .principal(authentication)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inventoryAdjustmentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentStock").value(20));
    }

    @Test
    void shouldFindAdjustmentsSuccessfully() throws Exception {
        InventoryAdjustmentResponse inventoryAdjustmentResponse = new InventoryAdjustmentResponse(
                1L, 1L, "Coffee", AdjustmentType.INCREASE, 10, "Restock", "note",
                20, "admin", Instant.now()
        );
        InventoryAdjustmentPageResponse inventoryAdjustmentPageResponse = new InventoryAdjustmentPageResponse(
                List.of(inventoryAdjustmentResponse), 1, 1, 0, 20
        );

        when(inventoryService.findAdjustments(0, 20, null, null, null, null)).thenReturn(inventoryAdjustmentPageResponse);

        mockMvc.perform(get("/api/v1/inventory/adjustments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldFindLowStockProductsSuccessfully() throws Exception {
        LowStockProductResponse lowStockProductResponse = new LowStockProductResponse(1L, "SP-001", "Coffee", 3, 10, "LOW_STOCK");
        when(inventoryService.findLowStockProducts(10)).thenReturn(List.of(lowStockProductResponse));

        mockMvc.perform(get("/api/v1/inventory/low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("LOW_STOCK"));
    }
}
