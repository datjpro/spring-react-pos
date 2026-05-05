package com.pos.service.impl;

import com.pos.service.*;

import com.pos.service.AuditLogService;
import com.pos.entity.BranchEntity;
import com.pos.repository.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.service.UserContextService;
import com.pos.entity.ProductEntity;
import com.pos.repository.ProductRepository;
import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockAdjustmentServiceImpl implements StockAdjustmentService {
    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final StockMovementService stockMovementService;
    private final AuditLogService auditLogService;
    private final UserContextService userContextService;
    private final BranchAccessGuard branchAccessService;

    public StockAdjustmentServiceImpl(ProductRepository productRepository, BranchRepository branchRepository,
            StockMovementService stockMovementService, AuditLogService auditLogService,
            UserContextService userContextService, BranchAccessGuard branchAccessService) {
        this.productRepository = productRepository;
        this.branchRepository = branchRepository;
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
        int nextStock = product.getStock() + request.quantityDelta();
        if (nextStock < 0)
            throw new BadRequestException("Stock cannot be negative after adjustment");
        product.setStock(nextStock);
        productRepository.save(product);
        MovementType movementType = request.quantityDelta() >= 0 ? MovementType.IN : MovementType.ADJUSTMENT;
        stockMovementService.record(product, branch, movementType, Math.abs(request.quantityDelta()),
                "STOCK_ADJUSTMENT", product.getId(), request.note(), user.getUsername());
        auditLogService.log(user.getUsername(), "ADJUST_STOCK", "PRODUCT", product.getId(),
                request.reason() + (request.note() == null ? "" : " - " + request.note()));
        return new StockAdjustmentResponse(product.getId(), branch.getId(), request.quantityDelta(), nextStock,
                request.reason(), user.getUsername());
    }
}
