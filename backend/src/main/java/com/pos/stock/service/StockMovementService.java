package com.pos.stock.service;

import com.pos.branch.entity.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.product.entity.ProductEntity;
import com.pos.stock.dto.StockMovementResponse;
import org.springframework.data.domain.Page;

public interface StockMovementService {
    void record(ProductEntity product, BranchEntity branch, MovementType type, Integer quantity, String referenceType, Long referenceId, String note, String actor);
    Page<StockMovementResponse> findByBranch(Long branchId, int page, int size);
}
