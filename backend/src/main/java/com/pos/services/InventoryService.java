package com.pos.services;

import com.pos.dtos.response.InventoryAdjustmentPageResponse;
import com.pos.dtos.request.InventoryAdjustmentRequest;
import com.pos.dtos.response.InventoryAdjustmentResponse;
import com.pos.dtos.response.LowStockProductResponse;
import com.pos.common.enums.AdjustmentType;

import java.time.Instant;
import java.util.List;

public interface InventoryService {

    InventoryAdjustmentResponse adjustInventory(InventoryAdjustmentRequest inventoryAdjustmentRequest, String username);

    InventoryAdjustmentPageResponse findAdjustments(int page,
            int size,
            Long productId,
            AdjustmentType adjustmentType,
            Instant from,
            Instant to);

    List<LowStockProductResponse> findLowStockProducts(int threshold);
}
