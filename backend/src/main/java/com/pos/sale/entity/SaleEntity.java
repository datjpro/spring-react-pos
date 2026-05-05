package com.pos.sale.entity;

import com.pos.branch.entity.BranchEntity;
import com.pos.common.enums.SaleStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity @Table(name = "sales")
public class SaleEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "sale_code", nullable = false, unique = true, length = 30) private String saleCode;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id", nullable = false) private BranchEntity branch;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private SaleStatus status;
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2) private BigDecimal totalAmount;
    @Column(name = "created_by", nullable = false, length = 50) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true) private List<SaleItemEntity> items = new ArrayList<>();
    @PrePersist public void prePersist(){createdAt=Instant.now();}
    public void addItem(SaleItemEntity item){items.add(item);item.setSale(this);}
    public Long getId(){return id;} public String getSaleCode(){return saleCode;} public void setSaleCode(String saleCode){this.saleCode=saleCode;} public BranchEntity getBranch(){return branch;} public void setBranch(BranchEntity branch){this.branch=branch;} public SaleStatus getStatus(){return status;} public void setStatus(SaleStatus status){this.status=status;} public BigDecimal getTotalAmount(){return totalAmount;} public void setTotalAmount(BigDecimal totalAmount){this.totalAmount=totalAmount;} public String getCreatedBy(){return createdBy;} public void setCreatedBy(String createdBy){this.createdBy=createdBy;} public Instant getCreatedAt(){return createdAt;} public List<SaleItemEntity> getItems(){return items;}
}
