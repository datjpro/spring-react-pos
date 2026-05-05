package com.pos.controller;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/purchases")
public class PurchaseController {
    private final PurchaseService purchaseService;
    public PurchaseController(PurchaseService purchaseService){this.purchaseService=purchaseService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping
    public ResponseEntity<PurchaseResponse> create(@Valid @RequestBody CreatePurchaseRequest request, Authentication authentication){return ResponseEntity.status(HttpStatus.CREATED).body(purchaseService.create(request, authentication));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping
    public ResponseEntity<List<PurchaseResponse>> findAll(){return ResponseEntity.ok(purchaseService.findAll());}
}
