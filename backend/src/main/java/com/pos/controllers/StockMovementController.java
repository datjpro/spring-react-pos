package com.pos.controllers;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.*;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

@RestController @Validated @RequestMapping("/api/v1/stock-movements")
public class StockMovementController {
    private final StockMovementService stockMovementService;
    private final StockAdjustmentService stockAdjustmentService;
    public StockMovementController(StockMovementService stockMovementService, StockAdjustmentService stockAdjustmentService){this.stockMovementService=stockMovementService; this.stockAdjustmentService=stockAdjustmentService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')") @GetMapping
    public ResponseEntity<Page<StockMovementResponse>> findByBranch(@RequestParam @Min(1) Long branchId,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size){return ResponseEntity.ok(stockMovementService.findByBranch(branchId,page,size));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping("/adjustments")
    public ResponseEntity<StockAdjustmentResponse> adjust(@Valid @RequestBody StockAdjustmentRequest request, Authentication authentication){return ResponseEntity.status(HttpStatus.CREATED).body(stockAdjustmentService.adjust(request, authentication));}
}
