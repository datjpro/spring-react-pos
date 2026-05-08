package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface PurchaseService {
    PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication);

    PurchaseResponse findById(Long id, Authentication authentication);

    PurchaseResponse cancel(Long id, CancelPurchaseRequest request, Authentication authentication);

    List<PurchaseResponse> findAll();
}
