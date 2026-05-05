package com.pos.repository;

import com.pos.common.enums.SaleStatus;
import com.pos.entity.SaleItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItemEntity, Long> {

    @Query("""
            select function('date', sale.createdAt), sum(sale.totalAmount), count(distinct sale.id)
            from SaleEntity sale
            where sale.status = :status
              and sale.createdAt between :from and :to
              and (:branchId is null or sale.branch.id = :branchId)
            group by function('date', sale.createdAt)
            order by function('date', sale.createdAt) asc
            """)
    List<Object[]> summarizeRevenueByDate(@Param("status") SaleStatus status,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to,
                                           @Param("branchId") Long branchId);

    @Query("""
            select item.product.id, item.product.sku, item.product.name, sum(item.quantity), sum(item.lineTotal)
            from SaleItemEntity item
            where item.sale.status = :status
              and item.sale.createdAt between :from and :to
              and (:branchId is null or item.sale.branch.id = :branchId)
            group by item.product.id, item.product.sku, item.product.name
            """)
    List<Object[]> summarizeTopProducts(@Param("status") SaleStatus status,
                                         @Param("from") Instant from,
                                         @Param("to") Instant to,
                                         @Param("branchId") Long branchId);
}
