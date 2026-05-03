package com.pos.backend.service;

import com.pos.backend.dto.InventoryAdjustmentPageResponse;
import com.pos.backend.dto.InventoryAdjustmentRequest;
import com.pos.backend.dto.InventoryAdjustmentResponse;
import com.pos.backend.dto.LowStockProductResponse;
import com.pos.backend.entity.InventoryAdjustmentType;

import java.time.Instant;
import java.util.List;

public interface InventoryService {

    InventoryAdjustmentResponse adjustInventory(InventoryAdjustmentRequest inventoryAdjustmentRequest, String username);

    InventoryAdjustmentPageResponse findAdjustments(int page,
                                                    int size,
                                                    Long productId,
                                                    InventoryAdjustmentType adjustmentType,
                                                    Instant from,
                                                    Instant to);

    List<LowStockProductResponse> findLowStockProducts(int threshold);
}
