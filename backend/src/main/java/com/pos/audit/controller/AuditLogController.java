package com.pos.audit.controller;

import com.pos.audit.dto.AuditLogResponse;
import com.pos.audit.service.AuditLogService;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController @Validated @RequestMapping("/api/v1/audit-logs")
public class AuditLogController {
    private final AuditLogService auditLogService;
    public AuditLogController(AuditLogService auditLogService){this.auditLogService=auditLogService;}
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> findAll(@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size){return ResponseEntity.ok(auditLogService.findAll(page,size));}
}
