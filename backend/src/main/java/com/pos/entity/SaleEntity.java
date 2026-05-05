package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.BranchEntity;
import com.pos.common.enums.SaleStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.*;

@Entity
@Getter
@Setter
@Table(name = "sales")
public class SaleEntity extends CreatedEntity {
    @Column(name = "sale_code", nullable = false, unique = true, length = 30)
    private String saleCode;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SaleStatus status;
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItemEntity> items = new ArrayList<>();

    public void addItem(SaleItemEntity item) {
        items.add(item);
        item.setSale(this);
    }



}
