package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import org.springframework.security.core.Authentication;

public interface StockAdjustmentService {
    StockAdjustmentResponse adjust(StockAdjustmentRequest request, Authentication authentication);
}
