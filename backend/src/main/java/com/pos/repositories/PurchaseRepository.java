package com.pos.repositories;

import com.pos.entities.PurchaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface PurchaseRepository extends JpaRepository<PurchaseEntity, Long> {

    @Query("""
            select count(distinct purchase.id), coalesce(sum(item.quantity), 0), coalesce(sum(item.lineTotal), 0)
            from PurchaseEntity purchase
            join purchase.items item
            where purchase.status = com.pos.common.enums.PurchaseStatus.CONFIRMED
              and purchase.createdAt between :from and :to
              and (:supplierId is null or purchase.supplier.id = :supplierId)
              and (:branchId is null or purchase.branch.id = :branchId)
            """)
    Object[] summarizePurchases(@Param("from") Instant from,
                                 @Param("to") Instant to,
                                 @Param("supplierId") Long supplierId,
                                 @Param("branchId") Long branchId);
}
