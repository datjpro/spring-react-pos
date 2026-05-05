package com.pos.service;

import com.pos.service.AuditLogService;
import com.pos.entity.BranchEntity;
import com.pos.repository.BranchRepository;
import com.pos.common.enums.MovementType;
import com.pos.common.enums.PurchaseStatus;
import com.pos.exception.*;
import com.pos.security.BranchAccessGuard;
import com.pos.service.UserContextService;
import com.pos.entity.ProductEntity;
import com.pos.repository.ProductRepository;
import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.entity.*;
import com.pos.repository.PurchaseRepository;
import com.pos.service.StockMovementService;
import com.pos.entity.SupplierEntity;
import com.pos.repository.SupplierRepository;
import com.pos.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PurchaseServiceImpl implements PurchaseService {
    private final PurchaseRepository purchaseRepository; private final SupplierRepository supplierRepository; private final BranchRepository branchRepository; private final ProductRepository productRepository; private final StockMovementService stockMovementService; private final AuditLogService auditLogService; private final UserContextService userContextService; private final BranchAccessGuard branchAccessService;
    public PurchaseServiceImpl(PurchaseRepository purchaseRepository,SupplierRepository supplierRepository,BranchRepository branchRepository,ProductRepository productRepository,StockMovementService stockMovementService,AuditLogService auditLogService,UserContextService userContextService,BranchAccessGuard branchAccessService){this.purchaseRepository=purchaseRepository;this.supplierRepository=supplierRepository;this.branchRepository=branchRepository;this.productRepository=productRepository;this.stockMovementService=stockMovementService;this.auditLogService=auditLogService;this.userContextService=userContextService;this.branchAccessService=branchAccessService;}
    @Transactional public PurchaseResponse create(CreatePurchaseRequest request, Authentication authentication){
        UserEntity user = userContextService.requireUser(authentication);
        branchAccessService.requireBranchAccess(user, request.branchId());
        BranchEntity branch = branchRepository.findByIdAndActiveTrue(request.branchId()).orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        SupplierEntity supplier = supplierRepository.findByIdAndActiveTrue(request.supplierId()).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        PurchaseEntity purchase = new PurchaseEntity(); purchase.setPurchaseCode("PUR-" + System.currentTimeMillis()); purchase.setBranch(branch); purchase.setSupplier(supplier); purchase.setStatus(PurchaseStatus.CONFIRMED); purchase.setCreatedBy(user.getUsername());
        BigDecimal total = BigDecimal.ZERO;
        for (CreatePurchaseItemRequest itemRequest : request.items()) {
            ProductEntity product = productRepository.findByIdAndActiveTrue(itemRequest.productId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            product.setStock(product.getStock() + itemRequest.quantity());
            productRepository.save(product);
            PurchaseItemEntity item = new PurchaseItemEntity(); item.setProduct(product); item.setQuantity(itemRequest.quantity()); item.setUnitCost(itemRequest.unitCost()); item.setLineTotal(itemRequest.unitCost().multiply(BigDecimal.valueOf(itemRequest.quantity()))); purchase.addItem(item); total = total.add(item.getLineTotal());
        }
        purchase.setTotalAmount(total);
        PurchaseEntity saved = purchaseRepository.save(purchase);
        for (PurchaseItemEntity item : saved.getItems()) { stockMovementService.record(item.getProduct(), branch, MovementType.IN, item.getQuantity(), "PURCHASE", saved.getId(), request.note(), user.getUsername()); }
        auditLogService.log(user.getUsername(), "CONFIRM_PURCHASE", "PURCHASE", saved.getId(), request.note());
        return map(saved);
    }
    public List<PurchaseResponse> findAll(){return purchaseRepository.findAll().stream().map(this::map).toList();}
    private PurchaseResponse map(PurchaseEntity entity){ return new PurchaseResponse(entity.getId(), entity.getPurchaseCode(), entity.getSupplier().getId(), entity.getSupplier().getName(), entity.getBranch().getId(), entity.getBranch().getName(), entity.getStatus(), entity.getTotalAmount(), entity.getItems().stream().map(i -> new PurchaseItemResponse(i.getProduct().getId(), i.getProduct().getName(), i.getQuantity(), i.getUnitCost(), i.getLineTotal())).toList(), entity.getCreatedBy(), entity.getCreatedAt()); }
}
