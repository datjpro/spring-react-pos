package com.pos.service;

import com.pos.entity.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.entity.ProductEntity;
import com.pos.dto.response.StockMovementResponse;
import org.springframework.data.domain.Page;

public interface StockMovementService {
    void record(ProductEntity product, BranchEntity branch, MovementType type, Integer quantity, String referenceType, Long referenceId, String note, String actor);
    Page<StockMovementResponse> findByBranch(Long branchId, int page, int size);
}
