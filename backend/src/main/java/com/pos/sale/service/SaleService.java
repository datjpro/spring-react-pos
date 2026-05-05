package com.pos.sale.service;

import com.pos.sale.dto.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface SaleService {
    SaleResponse create(CreateSaleRequest request, Authentication authentication);
    List<SaleResponse> findAll();
}
