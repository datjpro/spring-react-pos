package com.pos.entities;

import lombok.Getter;
import lombok.Setter;

import com.pos.entities.base.CreatedEntity;

import com.pos.entities.BranchEntity;
import com.pos.common.enums.PurchaseStatus;
import com.pos.entities.SupplierEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.*;

@Entity
@Getter
@Setter
@Table(name = "purchases")
public class PurchaseEntity extends CreatedEntity {
    @Column(name = "purchase_code", nullable = false, unique = true, length = 30)
    private String purchaseCode;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private SupplierEntity supplier;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchaseStatus status;
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItemEntity> items = new ArrayList<>();

    public void addItem(PurchaseItemEntity item) {
        items.add(item);
        item.setPurchase(this);
    }




}
