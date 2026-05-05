package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.*;

@Entity
@Getter
@Setter
@Table(name = "audit_logs")
public class AuditLogEntity extends CreatedEntity {
    @Column(nullable = false, length = 50)
    private String actor;
    @Column(nullable = false, length = 50)
    private String action;
    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    @Column(length = 2000)
    private String details;



}
