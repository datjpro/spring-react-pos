package com.pos.repository;

import com.pos.entity.InventoryAdjustmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustmentEntity, Long>, JpaSpecificationExecutor<InventoryAdjustmentEntity> {
}
