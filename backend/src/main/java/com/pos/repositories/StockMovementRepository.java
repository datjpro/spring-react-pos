package com.pos.repositories;

import com.pos.entities.StockMovementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovementEntity, Long> {
    Page<StockMovementEntity> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);

    @Query("""
            select movement
            from StockMovementEntity movement
            where movement.product.id = :productId
              and movement.branch.id = :branchId
              and movement.createdAt between :from and :to
            order by movement.createdAt asc
            """)
    List<StockMovementEntity> findStockCard(@Param("productId") Long productId,
                                             @Param("branchId") Long branchId,
                                             @Param("from") Instant from,
                                             @Param("to") Instant to);
}
