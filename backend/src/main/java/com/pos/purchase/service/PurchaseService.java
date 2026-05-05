package com.pos.purchase.service;

import com.pos.purchase.dto.*;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface PurchaseService {
    PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication);
    List<PurchaseResponse> findAll();
}
