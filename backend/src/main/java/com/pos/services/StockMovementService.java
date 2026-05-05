package com.pos.services;

import com.pos.entities.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.entities.ProductEntity;
import com.pos.dtos.response.StockMovementResponse;
import org.springframework.data.domain.Page;

public interface StockMovementService {
    void record(ProductEntity product, BranchEntity branch, MovementType type, Integer quantity, String referenceType,
            Long referenceId, String note, String actor);

    Page<StockMovementResponse> findByBranch(Long branchId, int page, int size);
}
