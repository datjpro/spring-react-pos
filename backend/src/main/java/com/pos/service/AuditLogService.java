package com.pos.service;

import com.pos.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;

public interface AuditLogService {
    void log(String actor, String action, String entityName, Long entityId, String details);

    Page<AuditLogResponse> findAll(int page, int size);
}
