package com.pos.entity;

import com.pos.entity.ProductEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "sale_items")
public class SaleItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sale_id", nullable = false) private SaleEntity sale;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false) private ProductEntity product;
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2) private BigDecimal unitPrice;
    @Column(nullable = false) private Integer quantity;
    @Column(name = "line_total", nullable = false, precision = 15, scale = 2) private BigDecimal lineTotal;
    public Long getId(){return id;} public SaleEntity getSale(){return sale;} public void setSale(SaleEntity sale){this.sale=sale;} public ProductEntity getProduct(){return product;} public void setProduct(ProductEntity product){this.product=product;} public BigDecimal getUnitPrice(){return unitPrice;} public void setUnitPrice(BigDecimal unitPrice){this.unitPrice=unitPrice;} public Integer getQuantity(){return quantity;} public void setQuantity(Integer quantity){this.quantity=quantity;} public BigDecimal getLineTotal(){return lineTotal;} public void setLineTotal(BigDecimal lineTotal){this.lineTotal=lineTotal;}
}
