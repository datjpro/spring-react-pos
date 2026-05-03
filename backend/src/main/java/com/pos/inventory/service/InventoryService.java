package com.pos.inventory.service;

import com.pos.inventory.dto.InventoryAdjustmentPageResponse;
import com.pos.inventory.dto.InventoryAdjustmentRequest;
import com.pos.inventory.dto.InventoryAdjustmentResponse;
import com.pos.inventory.dto.LowStockProductResponse;
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
