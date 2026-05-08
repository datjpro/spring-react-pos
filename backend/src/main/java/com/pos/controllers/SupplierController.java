package com.pos.controllers;

import com.pos.common.dto.MessageResponse;
import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.SupplierService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @Validated @RequestMapping("/api/v1/suppliers")
public class SupplierController {
    private final SupplierService supplierService;
    public SupplierController(SupplierService supplierService){this.supplierService=supplierService;}
    @GetMapping public ResponseEntity<List<SupplierResponse>> findAll(){return ResponseEntity.ok(supplierService.findAll());}
    @GetMapping("/{id}") public ResponseEntity<SupplierResponse> findById(@PathVariable @Min(1) Long id){return ResponseEntity.ok(supplierService.findById(id));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(request));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PutMapping("/{id}") public ResponseEntity<SupplierResponse> update(@PathVariable @Min(1) Long id,@Valid @RequestBody SupplierRequest request){return ResponseEntity.ok(supplierService.update(id,request));}
    @PreAuthorize("hasRole('ADMIN')") @DeleteMapping("/{id}") public ResponseEntity<MessageResponse> delete(@PathVariable @Min(1) Long id){supplierService.delete(id); return ResponseEntity.ok(new MessageResponse("Deleted supplier"));}
}
