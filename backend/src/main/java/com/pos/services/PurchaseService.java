package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface PurchaseService {
    PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication);

    List<PurchaseResponse> findAll();
}
