package com.pos.controller;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.service.BranchService;
import com.pos.common.dto.MessageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @Validated @RequestMapping("/api/v1/branches")
public class BranchController {
    private final BranchService branchService;
    public BranchController(BranchService branchService){this.branchService=branchService;}
    @GetMapping public ResponseEntity<List<BranchResponse>> findAll(){return ResponseEntity.ok(branchService.findAll());}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PostMapping public ResponseEntity<BranchResponse> create(@Valid @RequestBody BranchRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(branchService.create(request));}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @PutMapping("/{id}") public ResponseEntity<BranchResponse> update(@PathVariable @Min(1) Long id,@Valid @RequestBody BranchRequest request){return ResponseEntity.ok(branchService.update(id,request));}
    @PreAuthorize("hasRole('ADMIN')") @DeleteMapping("/{id}") public ResponseEntity<MessageResponse> delete(@PathVariable @Min(1) Long id){branchService.delete(id); return ResponseEntity.ok(new MessageResponse("Deleted branch"));}
}
