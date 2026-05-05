package com.pos.entity;

import com.pos.entity.ProductEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "purchase_items")
public class PurchaseItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "purchase_id", nullable = false) private PurchaseEntity purchase;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false) private ProductEntity product;
    @Column(name = "unit_cost", nullable = false, precision = 15, scale = 2) private BigDecimal unitCost;
    @Column(nullable = false) private Integer quantity;
    @Column(name = "line_total", nullable = false, precision = 15, scale = 2) private BigDecimal lineTotal;
    public Long getId(){return id;} public PurchaseEntity getPurchase(){return purchase;} public void setPurchase(PurchaseEntity purchase){this.purchase=purchase;} public ProductEntity getProduct(){return product;} public void setProduct(ProductEntity product){this.product=product;} public BigDecimal getUnitCost(){return unitCost;} public void setUnitCost(BigDecimal unitCost){this.unitCost=unitCost;} public Integer getQuantity(){return quantity;} public void setQuantity(Integer quantity){this.quantity=quantity;} public BigDecimal getLineTotal(){return lineTotal;} public void setLineTotal(BigDecimal lineTotal){this.lineTotal=lineTotal;}
}
