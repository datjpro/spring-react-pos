package com.pos.services;

import com.pos.dtos.response.AuditLogResponse;
import com.pos.entities.AuditLogEntity;
import com.pos.repositories.AuditLogRepository;
import com.pos.services.impl.AuditLogServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceImplTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    @Test
    void shouldLogSuccessfully() {
        auditLogService.log("admin", "CREATE", "PRODUCT", 1L, "details");
        verify(auditLogRepository).save(any(AuditLogEntity.class));
    }

    @Test
    void shouldFindAllLogsSuccessfully() {
        AuditLogEntity entity = new AuditLogEntity();
        entity.setId(1L);
        entity.setActor("admin");
        entity.setAction("CREATE");
        entity.setEntityName("PRODUCT");
        entity.setEntityId(1L);
        entity.setDetails("details");

        when(auditLogRepository.findAllByOrderByCreatedAtDesc(any()))
                .thenReturn(new PageImpl<>(List.of(entity)));

        var page = auditLogService.findAll(0, 20);

        assertEquals(1, page.getTotalElements());
        AuditLogResponse response = page.getContent().get(0);
        assertEquals("admin", response.actor());
    }
}
