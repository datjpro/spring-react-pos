package com.pos.services.impl;

import com.pos.services.*;

import com.pos.services.AuditLogService;
import com.pos.entities.BranchEntity;
import com.pos.repositories.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.enums.PurchaseStatus;
import com.pos.common.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.services.UserContextService;
import com.pos.entities.ProductEntity;
import com.pos.repositories.ProductRepository;
import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import com.pos.entities.*;
import com.pos.repositories.PurchaseRepository;
import com.pos.services.StockMovementService;
import com.pos.entities.SupplierEntity;
import com.pos.repositories.SupplierRepository;
import com.pos.entities.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PurchaseServiceImpl implements PurchaseService {
    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final StockMovementService stockMovementService;
    private final AuditLogService auditLogService;
    private final UserContextService userContextService;
    private final BranchAccessGuard branchAccessService;

    public PurchaseServiceImpl(PurchaseRepository purchaseRepository, SupplierRepository supplierRepository,
            BranchRepository branchRepository, ProductRepository productRepository,
            StockMovementService stockMovementService, AuditLogService auditLogService,
            UserContextService userContextService, BranchAccessGuard branchAccessService) {
        this.purchaseRepository = purchaseRepository;
        this.supplierRepository = supplierRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.stockMovementService = stockMovementService;
        this.auditLogService = auditLogService;
        this.userContextService = userContextService;
        this.branchAccessService = branchAccessService;
    }

    @Transactional
    public PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        branchAccessService.requireBranchAccess(user, request.branchId());
        BranchEntity branch = branchRepository.findByIdAndActiveTrue(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        SupplierEntity supplier = supplierRepository.findByIdAndActiveTrue(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        PurchaseEntity purchase = new PurchaseEntity();
        purchase.setPurchaseCode("PUR-" + System.currentTimeMillis());
        purchase.setBranch(branch);
        purchase.setSupplier(supplier);
        purchase.setStatus(PurchaseStatus.CONFIRMED);
        purchase.setCreatedBy(user.getUsername());
        BigDecimal total = BigDecimal.ZERO;
        for (CreatePurchaseItemRequest itemRequest : request.items()) {
            ProductEntity product = productRepository.findByIdAndActiveTrue(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            product.setStock(product.getStock() + itemRequest.quantity());
            productRepository.save(product);
            PurchaseItemEntity item = new PurchaseItemEntity();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitCost(itemRequest.unitCost());
            item.setLineTotal(itemRequest.unitCost().multiply(BigDecimal.valueOf(itemRequest.quantity())));
            purchase.addItem(item);
            total = total.add(item.getLineTotal());
        }
        purchase.setTotalAmount(total);
        PurchaseEntity saved = purchaseRepository.save(purchase);
        for (PurchaseItemEntity item : saved.getItems()) {
            stockMovementService.record(item.getProduct(), branch, MovementType.IN, item.getQuantity(), "PURCHASE",
                    saved.getId(), request.note(), user.getUsername());
        }
        auditLogService.log(user.getUsername(), "CONFIRM_PURCHASE", "PURCHASE", saved.getId(), request.note());
        return map(saved);
    }

    public List<PurchaseResponse> findAll() {
        return purchaseRepository.findAll().stream().map(this::map).toList();
    }

    public PurchaseResponse findById(Long id, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        PurchaseEntity purchase = find(id);
        branchAccessService.requireBranchAccess(user, purchase.getBranch().getId());
        return map(purchase);
    }

    @Transactional
    public PurchaseResponse cancel(Long id, CancelPurchaseRequest request, Authentication authentication) {
        UserEntity user = userContextService.requireUser(authentication);
        PurchaseEntity purchase = find(id);
        branchAccessService.requireBranchAccess(user, purchase.getBranch().getId());

        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new BadRequestException("Purchase already cancelled");
        }

        for (PurchaseItemEntity item : purchase.getItems()) {
            ProductEntity product = item.getProduct();
            int newStock = product.getStock() - item.getQuantity();
            if (newStock < 0) {
                throw new BadRequestException("Insufficient stock to cancel purchase");
            }
            product.setStock(newStock);
            productRepository.save(product);
            stockMovementService.record(product, purchase.getBranch(), MovementType.OUT, item.getQuantity(),
                    "PURCHASE_CANCEL", purchase.getId(), request.reason(), user.getUsername());
        }

        purchase.setStatus(PurchaseStatus.CANCELLED);
        PurchaseEntity saved = purchaseRepository.save(purchase);
        auditLogService.log(user.getUsername(), "CANCEL_PURCHASE", "PURCHASE", saved.getId(), request.reason());
        return map(saved);
    }

    private PurchaseEntity find(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found"));
    }

    private PurchaseResponse map(PurchaseEntity entity) {
        return new PurchaseResponse(entity.getId(), entity.getPurchaseCode(), entity.getSupplier().getId(),
                entity.getSupplier().getName(), entity.getBranch().getId(), entity.getBranch().getName(),
                entity.getStatus(), entity.getTotalAmount(),
                entity.getItems().stream()
                        .map(i -> new PurchaseItemResponse(i.getProduct().getId(), i.getProduct().getName(),
                                i.getQuantity(), i.getUnitCost(), i.getLineTotal()))
                        .toList(),
                entity.getCreatedBy(), entity.getCreatedAt());
    }
}
