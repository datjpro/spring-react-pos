package com.pos.services;

import com.pos.dtos.response.StockLevelPageResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.ProductEntity;
import com.pos.entities.UserEntity;

public interface BranchProductStockService {

    int adjustStock(ProductEntity product, BranchEntity branch, int quantityDelta);

    void syncTotalStockToDefaultBranch(ProductEntity product, int targetTotalStock);

    StockLevelPageResponse findStockLevels(UserEntity user, Long branchId, Long productId, int page, int size);
}
