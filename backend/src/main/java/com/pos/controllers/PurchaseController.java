package com.pos.controllers;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @Validated @RequestMapping("/api/v1/purchases")
@Tag(name = "Purchases", description = "Purchase receiving workflow")
public class PurchaseController {
    private final PurchaseService purchaseService;
    public PurchaseController(PurchaseService purchaseService){this.purchaseService=purchaseService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping @Operation(summary = "Create purchase", description = "Create confirmed purchase and increase stock")
    public ResponseEntity<PurchaseResponse> create(@Valid @RequestBody CreatePurchaseRequest request, Authentication authentication){return ResponseEntity.status(HttpStatus.CREATED).body(purchaseService.create(request, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping @Operation(summary = "List purchases", description = "Get all purchases")
    public ResponseEntity<List<PurchaseResponse>> findAll(){return ResponseEntity.ok(purchaseService.findAll());}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping("/{id}") @Operation(summary = "Get purchase detail", description = "Get purchase by id")
    public ResponseEntity<PurchaseResponse> findById(@PathVariable @Min(1) Long id, Authentication authentication){return ResponseEntity.ok(purchaseService.findById(id, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping("/{id}/cancel") @Operation(summary = "Cancel purchase", description = "Cancel purchase and reverse stock")
    public ResponseEntity<PurchaseResponse> cancel(@PathVariable @Min(1) Long id, @Valid @RequestBody(required = false) CancelPurchaseRequest request, Authentication authentication){return ResponseEntity.ok(purchaseService.cancel(id, request == null ? new CancelPurchaseRequest(null) : request, authentication));}
}
