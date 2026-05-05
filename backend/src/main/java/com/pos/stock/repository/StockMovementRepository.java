package com.pos.stock.repository;

import com.pos.stock.entity.StockMovementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovementEntity, Long> {
    Page<StockMovementEntity> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
}
