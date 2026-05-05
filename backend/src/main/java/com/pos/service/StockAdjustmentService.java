package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import org.springframework.security.core.Authentication;

public interface StockAdjustmentService {
    StockAdjustmentResponse adjust(StockAdjustmentRequest request, Authentication authentication);
}
