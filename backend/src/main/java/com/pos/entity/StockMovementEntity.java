package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.base.CreatedEntity;

import com.pos.entity.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.entity.ProductEntity;
import jakarta.persistence.*;

@Entity
@Getter
@Setter
@Table(name = "stock_movements")
public class StockMovementEntity extends CreatedEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;
    @Column(nullable = false)
    private Integer quantity;
    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType;
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;
    @Column(length = 500)
    private String note;
    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;





}
