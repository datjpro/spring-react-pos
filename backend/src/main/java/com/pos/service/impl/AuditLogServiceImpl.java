package com.pos.service.impl;

import com.pos.service.*;

import com.pos.dto.response.AuditLogResponse;
import com.pos.entity.AuditLogEntity;
import com.pos.repository.AuditLogRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actor, String action, String entityName, Long entityId, String details) {
        AuditLogEntity e = new AuditLogEntity();
        e.setActor(actor);
        e.setAction(action);
        e.setEntityName(entityName);
        e.setEntityId(entityId);
        e.setDetails(details);
        auditLogRepository.save(e);
    }

    public Page<AuditLogResponse> findAll(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).map(this::map);
    }

    private AuditLogResponse map(AuditLogEntity e) {
        return new AuditLogResponse(e.getId(), e.getActor(), e.getAction(), e.getEntityName(), e.getEntityId(),
                e.getDetails(), e.getCreatedAt());
    }
}
