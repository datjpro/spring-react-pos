package com.pos.controllers;

import com.pos.dtos.response.InventoryAdjustmentPageResponse;
import com.pos.dtos.request.InventoryAdjustmentRequest;
import com.pos.dtos.response.InventoryAdjustmentResponse;
import com.pos.dtos.response.LowStockProductResponse;
import com.pos.common.enums.AdjustmentType;
import com.pos.services.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@Deprecated
@RestController
@Validated
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Legacy inventory adjustment and low-stock endpoints")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/adjustments")
    @Operation(summary = "Create inventory adjustment", description = "Create legacy inventory adjustment record")
    public ResponseEntity<InventoryAdjustmentResponse> adjustInventory(@Valid @RequestBody InventoryAdjustmentRequest inventoryAdjustmentRequest,
                                                                       Authentication authentication) {
        InventoryAdjustmentResponse inventoryAdjustmentResponse = inventoryService.adjustInventory(inventoryAdjustmentRequest, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryAdjustmentResponse);
    }

    @GetMapping("/adjustments")
    @Operation(summary = "List inventory adjustments", description = "Get paginated inventory adjustments")
    public ResponseEntity<InventoryAdjustmentPageResponse> findAdjustments(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size must be greater than or equal to 1") @Max(value = 100, message = "size must be less than or equal to 100") int size,
            @RequestParam(required = false) @Min(value = 1, message = "productId must be greater than 0") Long productId,
            @RequestParam(required = false) AdjustmentType type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        return ResponseEntity.ok(inventoryService.findAdjustments(page, size, productId, type, from, to));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "List low stock products", description = "Get products below stock threshold")
    public ResponseEntity<List<LowStockProductResponse>> findLowStockProducts(@RequestParam(defaultValue = "10") @Min(value = 0, message = "threshold must be greater than or equal to 0") int threshold) {
        return ResponseEntity.ok(inventoryService.findLowStockProducts(threshold));
    }
}
