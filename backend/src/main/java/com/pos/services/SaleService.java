package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface SaleService {
    SaleResponse create(CreateSaleRequest request, Authentication authentication);

    List<SaleResponse> findAll();
}
