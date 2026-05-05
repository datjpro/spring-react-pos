package com.pos.controllers;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.SaleService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/sales")
public class SaleController {
    private final SaleService saleService;
    public SaleController(SaleService saleService){this.saleService=saleService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')") @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody CreateSaleRequest request, Authentication authentication){return ResponseEntity.status(HttpStatus.CREATED).body(saleService.create(request, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping
    public ResponseEntity<List<SaleResponse>> findAll(){return ResponseEntity.ok(saleService.findAll());}
}
