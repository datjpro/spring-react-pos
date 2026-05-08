package com.pos.repositories;

import com.pos.entities.InventoryAdjustmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustmentEntity, Long>, JpaSpecificationExecutor<InventoryAdjustmentEntity> {
}
