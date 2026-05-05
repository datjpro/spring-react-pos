package com.pos.dtos.response;

import java.math.BigDecimal;

public record SaleItemResponse(Long productId, String productName, Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal) { }
