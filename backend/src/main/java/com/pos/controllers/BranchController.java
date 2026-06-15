package com.pos.controllers;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.services.BranchService;
import com.pos.common.dto.MessageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @Validated @RequestMapping("/api/v1/branches")
@Tag(name = "Branches", description = "Branch management")
public class BranchController {
    private final BranchService branchService;
    public BranchController(BranchService branchService){this.branchService=branchService;}
    @GetMapping @Operation(summary = "List branches", description = "Get all active branches") public ResponseEntity<List<BranchResponse>> findAll(){return ResponseEntity.ok(branchService.findAll());}
    @GetMapping("/{id}") @Operation(summary = "Get branch detail", description = "Get branch by id") public ResponseEntity<BranchResponse> findById(@PathVariable @Min(1) Long id){return ResponseEntity.ok(branchService.findById(id));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping @Operation(summary = "Create branch", description = "Create new branch") public ResponseEntity<BranchResponse> create(@Valid @RequestBody BranchRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(branchService.create(request));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PutMapping("/{id}") @Operation(summary = "Update branch", description = "Update branch by id") public ResponseEntity<BranchResponse> update(@PathVariable @Min(1) Long id,@Valid @RequestBody BranchRequest request){return ResponseEntity.ok(branchService.update(id,request));}
    @PreAuthorize("hasRole('ADMIN')") @DeleteMapping("/{id}") @Operation(summary = "Delete branch", description = "Soft delete branch by id") public ResponseEntity<MessageResponse> delete(@PathVariable @Min(1) Long id){branchService.delete(id); return ResponseEntity.ok(new MessageResponse("Deleted branch"));}
}
