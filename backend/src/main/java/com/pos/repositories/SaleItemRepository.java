package com.pos.repositories;

import com.pos.common.enums.SaleStatus;
import com.pos.entities.SaleItemEntity;
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

    @Query("""
            select function('date', sale.createdAt), sum(item.lineTotal), sum(coalesce(item.product.cost, 0) * item.quantity)
            from SaleItemEntity item
            join item.sale sale
            where sale.status = :status
              and sale.createdAt between :from and :to
              and (:branchId is null or sale.branch.id = :branchId)
            group by function('date', sale.createdAt)
            order by function('date', sale.createdAt) asc
            """)
    List<Object[]> summarizeProfitByDate(@Param("status") SaleStatus status,
                                          @Param("from") Instant from,
                                          @Param("to") Instant to,
                                          @Param("branchId") Long branchId);

    @Query("""
            select count(distinct sale.id), coalesce(sum(item.quantity), 0), coalesce(sum(item.lineTotal), 0)
            from SaleItemEntity item
            join item.sale sale
            where sale.status = :status
              and sale.createdAt between :from and :to
              and (:branchId is null or sale.branch.id = :branchId)
              and (:createdBy is null or sale.createdBy = :createdBy)
            """)
    Object[] summarizeSales(@Param("status") SaleStatus status,
                             @Param("from") Instant from,
                             @Param("to") Instant to,
                             @Param("branchId") Long branchId,
                             @Param("createdBy") String createdBy);
}
