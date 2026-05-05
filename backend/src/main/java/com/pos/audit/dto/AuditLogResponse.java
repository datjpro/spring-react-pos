package com.pos.audit.dto;

import java.time.Instant;

public record AuditLogResponse(Long id, String actor, String action, String entityName, Long entityId, String details, Instant createdAt) { }
