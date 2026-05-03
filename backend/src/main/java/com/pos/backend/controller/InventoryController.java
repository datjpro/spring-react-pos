package com.pos.backend.controller;

import com.pos.backend.dto.InventoryAdjustmentPageResponse;
import com.pos.backend.dto.InventoryAdjustmentRequest;
import com.pos.backend.dto.InventoryAdjustmentResponse;
import com.pos.backend.dto.LowStockProductResponse;
import com.pos.backend.entity.InventoryAdjustmentType;
import com.pos.backend.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/adjustments")
    public ResponseEntity<InventoryAdjustmentResponse> adjustInventory(@Valid @RequestBody InventoryAdjustmentRequest inventoryAdjustmentRequest,
                                                                       Authentication authentication) {
        InventoryAdjustmentResponse inventoryAdjustmentResponse = inventoryService.adjustInventory(inventoryAdjustmentRequest, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryAdjustmentResponse);
    }

    @GetMapping("/adjustments")
    public ResponseEntity<InventoryAdjustmentPageResponse> findAdjustments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) InventoryAdjustmentType type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        return ResponseEntity.ok(inventoryService.findAdjustments(page, size, productId, type, from, to));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockProductResponse>> findLowStockProducts(@RequestParam(defaultValue = "10") int threshold) {
        return ResponseEntity.ok(inventoryService.findLowStockProducts(threshold));
    }
}
