package com.pos.service;

import com.pos.dto.response.InventoryAdjustmentPageResponse;
import com.pos.dto.request.InventoryAdjustmentRequest;
import com.pos.dto.response.InventoryAdjustmentResponse;
import com.pos.dto.response.LowStockProductResponse;
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
