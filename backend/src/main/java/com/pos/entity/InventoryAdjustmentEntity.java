package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.base.CreatedEntity;

import com.pos.common.enums.AdjustmentType;
import com.pos.entity.ProductEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Getter
@Setter
@Table(name = "inventory_adjustments")
public class InventoryAdjustmentEntity extends CreatedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false, length = 20)
    private AdjustmentType adjustmentType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;




}
