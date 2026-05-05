package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.ProductEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Table(name = "sale_items")
public class SaleItemEntity extends IdEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private SaleEntity sale;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;
    @Column(nullable = false)
    private Integer quantity;
    @Column(name = "line_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal lineTotal;



}
