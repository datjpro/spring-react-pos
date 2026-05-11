package com.pos.controllers;

import com.pos.dtos.response.AuditLogResponse;
import com.pos.services.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController @Validated @RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Audit trail queries")
public class AuditLogController {
    private final AuditLogService auditLogService;
    public AuditLogController(AuditLogService auditLogService){this.auditLogService=auditLogService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping
    @Operation(summary = "List audit logs", description = "Get paginated audit logs")
    public ResponseEntity<Page<AuditLogResponse>> findAll(@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size){return ResponseEntity.ok(auditLogService.findAll(page,size));}
}
