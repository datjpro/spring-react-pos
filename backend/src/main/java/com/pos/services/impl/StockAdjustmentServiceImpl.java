package com.pos.services.impl;

import com.pos.services.*;

import com.pos.services.AuditLogService;
import com.pos.entities.BranchEntity;
import com.pos.repositories.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.services.UserContextService;
import com.pos.entities.ProductEntity;
import com.pos.repositories.ProductRepository;
import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.entities.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockAdjustmentServiceImpl implements StockAdjustmentService {
    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final BranchProductStockService branchProductStockService;
    private final StockMovementService stockMovementService;
    private final AuditLogService auditLogService;
    private final UserContextService userContextService;
    private final BranchAccessGuard branchAccessService;

    public StockAdjustmentServiceImpl(ProductRepository productRepository, BranchRepository branchRepository,
            BranchProductStockService branchProductStockService, StockMovementService stockMovementService,
            AuditLogService auditLogService,
            UserContextService userContextService, BranchAccessGuard branchAccessService) {
        this.productRepository = productRepository;
        this.branchRepository = branchRepository;
        this.branchProductStockService = branchProductStockService;
        this.stockMovementService = stockMovementService;
        this.auditLogService = auditLogService;
        this.userContextService = userContextService;
        this.branchAccessService = branchAccessService;
    }

    @Transactional
    public StockAdjustmentResponse adjust(StockAdjustmentRequest request, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        branchAccessService.requireBranchAccess(user, request.branchId());
        ProductEntity product = productRepository.findByIdAndActiveTrue(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        BranchEntity branch = branchRepository.findByIdAndActiveTrue(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        int nextStock = branchProductStockService.adjustStock(product, branch, request.quantityDelta());
        MovementType movementType = request.quantityDelta() >= 0 ? MovementType.IN : MovementType.ADJUSTMENT;
        stockMovementService.record(product, branch, movementType, Math.abs(request.quantityDelta()),
                "STOCK_ADJUSTMENT", product.getId(), request.note(), user.getUsername());
        auditLogService.log(user.getUsername(), "ADJUST_STOCK", "PRODUCT", product.getId(),
                request.reason() + (request.note() == null ? "" : " - " + request.note()));
        return new StockAdjustmentResponse(product.getId(), branch.getId(), request.quantityDelta(), nextStock,
                request.reason(), user.getUsername());
    }
}
