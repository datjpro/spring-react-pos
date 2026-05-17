package com.pos.services.impl;

import com.pos.services.*;

import com.pos.services.AuditLogService;
import com.pos.entities.BranchEntity;
import com.pos.repositories.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.enums.SaleStatus;
import com.pos.common.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.services.UserContextService;
import com.pos.entities.ProductEntity;
import com.pos.repositories.ProductRepository;
import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.entities.*;
import com.pos.repositories.SaleRepository;
import com.pos.services.StockMovementService;
import com.pos.entities.UserEntity;
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
    private final BranchProductStockService branchProductStockService;
    private final StockMovementService stockMovementService;
    private final AuditLogService auditLogService;
    private final UserContextService userContextService;
    private final BranchAccessGuard branchAccessService;

    public SaleServiceImpl(SaleRepository saleRepository, BranchRepository branchRepository,
            ProductRepository productRepository, BranchProductStockService branchProductStockService,
            StockMovementService stockMovementService,
            AuditLogService auditLogService, UserContextService userContextService,
            BranchAccessGuard branchAccessService) {
        this.saleRepository = saleRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.branchProductStockService = branchProductStockService;
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
            try {
                branchProductStockService.adjustStock(product, branch, -itemRequest.quantity());
            } catch (BadRequestException badRequestException) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }
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

    public SaleResponse findById(Long id, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        SaleEntity sale = find(id);
        branchAccessService.requireBranchAccess(user, sale.getBranch().getId());
        return map(sale);
    }

    @Transactional
    public SaleResponse cancel(Long id, CancelSaleRequest request, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        SaleEntity sale = find(id);
        branchAccessService.requireBranchAccess(user, sale.getBranch().getId());

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Sale already cancelled");
        }

        for (SaleItemEntity item : sale.getItems()) {
            ProductEntity product = item.getProduct();
            branchProductStockService.adjustStock(product, sale.getBranch(), item.getQuantity());
            stockMovementService.record(product, sale.getBranch(), MovementType.IN, item.getQuantity(),
                    "SALE_CANCEL", sale.getId(), request.reason(), user.getUsername());
        }

        sale.setStatus(SaleStatus.CANCELLED);
        SaleEntity saved = saleRepository.save(sale);
        auditLogService.log(user.getUsername(), "CANCEL_SALE", "SALE", saved.getId(), request.reason());
        return map(saved);
    }

    private SaleEntity find(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
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
