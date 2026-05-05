package com.pos.stock.entity;

import com.pos.branch.entity.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.product.entity.ProductEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "stock_movements")
public class StockMovementEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false) private ProductEntity product;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "branch_id", nullable = false) private BranchEntity branch;
    @Enumerated(EnumType.STRING) @Column(name = "movement_type", nullable = false, length = 20) private MovementType movementType;
    @Column(nullable = false) private Integer quantity;
    @Column(name = "reference_type", nullable = false, length = 50) private String referenceType;
    @Column(name = "reference_id", nullable = false) private Long referenceId;
    @Column(length = 500) private String note;
    @Column(name = "created_by", nullable = false, length = 50) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @PrePersist public void prePersist(){createdAt=Instant.now();}
    public Long getId(){return id;} public ProductEntity getProduct(){return product;} public void setProduct(ProductEntity product){this.product=product;} public BranchEntity getBranch(){return branch;} public void setBranch(BranchEntity branch){this.branch=branch;} public MovementType getMovementType(){return movementType;} public void setMovementType(MovementType movementType){this.movementType=movementType;} public Integer getQuantity(){return quantity;} public void setQuantity(Integer quantity){this.quantity=quantity;} public String getReferenceType(){return referenceType;} public void setReferenceType(String referenceType){this.referenceType=referenceType;} public Long getReferenceId(){return referenceId;} public void setReferenceId(Long referenceId){this.referenceId=referenceId;} public String getNote(){return note;} public void setNote(String note){this.note=note;} public String getCreatedBy(){return createdBy;} public void setCreatedBy(String createdBy){this.createdBy=createdBy;} public Instant getCreatedAt(){return createdAt;}
}
