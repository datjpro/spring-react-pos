package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface PurchaseService {
    PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication);

    List<PurchaseResponse> findAll();
}
