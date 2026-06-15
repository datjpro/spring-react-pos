package com.pos.controllers;

import com.pos.dtos.response.StockLevelPageResponse;
import com.pos.entities.UserEntity;
import com.pos.services.BranchProductStockService;
import com.pos.services.UserContextService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/stock-levels")
@Tag(name = "Stock Levels", description = "Branch product stock levels")
public class StockLevelController {

    private final BranchProductStockService branchProductStockService;
    private final UserContextService userContextService;

    public StockLevelController(BranchProductStockService branchProductStockService, UserContextService userContextService) {
        this.branchProductStockService = branchProductStockService;
        this.userContextService = userContextService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @GetMapping
    @Operation(summary = "List stock levels", description = "Get product stock by branch")
    public ResponseEntity<StockLevelPageResponse> findStockLevels(
            @RequestParam(required = false) @Min(1) Long branchId,
            @RequestParam(required = false) @Min(1) Long productId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        return ResponseEntity.ok(branchProductStockService.findStockLevels(user, branchId, productId, page, size));
    }
}
