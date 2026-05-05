package com.pos.purchase.dto;

import java.math.BigDecimal;

public record PurchaseItemResponse(Long productId, String productName, Integer quantity, BigDecimal unitCost, BigDecimal lineTotal) { }
