package com.pos.controllers;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.SaleService;
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

@RestController @Validated @RequestMapping("/api/v1/sales")
@Tag(name = "Sales", description = "Sales transaction workflow")
public class SaleController {
    private final SaleService saleService;
    public SaleController(SaleService saleService){this.saleService=saleService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')") @PostMapping @Operation(summary = "Create sale", description = "Create sale and decrease stock")
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody CreateSaleRequest request, Authentication authentication){return ResponseEntity.status(HttpStatus.CREATED).body(saleService.create(request, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping @Operation(summary = "List sales", description = "Get all sales")
    public ResponseEntity<List<SaleResponse>> findAll(){return ResponseEntity.ok(saleService.findAll());}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping("/{id}") @Operation(summary = "Get sale detail", description = "Get sale by id")
    public ResponseEntity<SaleResponse> findById(@PathVariable @Min(1) Long id, Authentication authentication){return ResponseEntity.ok(saleService.findById(id, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping("/{id}/cancel") @Operation(summary = "Cancel sale", description = "Cancel sale and reverse stock")
    public ResponseEntity<SaleResponse> cancel(@PathVariable @Min(1) Long id, @Valid @RequestBody(required = false) CancelSaleRequest request, Authentication authentication){return ResponseEntity.ok(saleService.cancel(id, request == null ? new CancelSaleRequest(null) : request, authentication));}
}
