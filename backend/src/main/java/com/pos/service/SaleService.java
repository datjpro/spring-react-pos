package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface SaleService {
    SaleResponse create(CreateSaleRequest request, Authentication authentication);
    List<SaleResponse> findAll();
}
