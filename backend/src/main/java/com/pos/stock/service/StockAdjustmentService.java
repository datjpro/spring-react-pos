package com.pos.stock.service;

import com.pos.stock.dto.*;
import org.springframework.security.core.Authentication;

public interface StockAdjustmentService {
    StockAdjustmentResponse adjust(StockAdjustmentRequest request, Authentication authentication);
}
