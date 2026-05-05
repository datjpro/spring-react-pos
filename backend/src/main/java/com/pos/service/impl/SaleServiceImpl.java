package com.pos.service.impl;

import com.pos.service.*;

import com.pos.service.AuditLogService;
import com.pos.entity.BranchEntity;
import com.pos.repository.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.enums.SaleStatus;
import com.pos.common.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.service.UserContextService;
import com.pos.entity.ProductEntity;
import com.pos.repository.ProductRepository;
import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.entity.*;
import com.pos.repository.SaleRepository;
import com.pos.service.StockMovementService;
import com.pos.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class SaleServiceImpl implements SaleService {
    private final SaleRepository saleRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final StockMovementService stockMovementService;
    private final AuditLogService auditLogService;
    private final UserContextService userContextService;
    private final BranchAccessGuard branchAccessService;

    public SaleServiceImpl(SaleRepository saleRepository, BranchRepository branchRepository,
            ProductRepository productRepository, StockMovementService stockMovementService,
            AuditLogService auditLogService, UserContextService userContextService,
            BranchAccessGuard branchAccessService) {
        this.saleRepository = saleRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.stockMovementService = stockMovementService;
        this.auditLogService = auditLogService;
        this.userContextService = userContextService;
        this.branchAccessService = branchAccessService;
    }

    @Transactional
    public SaleResponse create(CreateSaleRequest request, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        branchAccessService.requireBranchAccess(user, request.branchId());
        BranchEntity branch = branchRepository.findByIdAndActiveTrue(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        SaleEntity sale = new SaleEntity();
        sale.setSaleCode("SAL-" + System.currentTimeMillis());
        sale.setBranch(branch);
        sale.setStatus(SaleStatus.COMPLETED);
        sale.setCreatedBy(user.getUsername());
        BigDecimal total = BigDecimal.ZERO;
        for (CreateSaleItemRequest itemRequest : request.items()) {
            ProductEntity product = productRepository.findByIdAndActiveTrue(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (product.getStock() < itemRequest.quantity())
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            product.setStock(product.getStock() - itemRequest.quantity());
            productRepository.save(product);
            SaleItemEntity item = new SaleItemEntity();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(product.getPrice());
            item.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
            sale.addItem(item);
            total = total.add(item.getLineTotal());
        }
        sale.setTotalAmount(total);
        SaleEntity saved = saleRepository.save(sale);
        for (SaleItemEntity item : saved.getItems()) {
            stockMovementService.record(item.getProduct(), branch, MovementType.OUT, item.getQuantity(), "SALE",
                    saved.getId(), request.note(), user.getUsername());
        }
        auditLogService.log(user.getUsername(), "CREATE_SALE", "SALE", saved.getId(), request.note());
        return map(saved);
    }

    public List<SaleResponse> findAll() {
        return saleRepository.findAll().stream().map(this::map).toList();
    }

    private SaleResponse map(SaleEntity entity) {
        return new SaleResponse(entity.getId(), entity.getSaleCode(), entity.getBranch().getId(),
                entity.getBranch().getName(), entity.getStatus(), entity.getTotalAmount(),
                entity.getItems().stream()
                        .map(i -> new SaleItemResponse(i.getProduct().getId(), i.getProduct().getName(),
                                i.getQuantity(), i.getUnitPrice(), i.getLineTotal()))
                        .toList(),
                entity.getCreatedBy(), entity.getCreatedAt());
    }
}
