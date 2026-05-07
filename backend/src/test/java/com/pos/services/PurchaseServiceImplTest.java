package com.pos.services;

import com.pos.common.enums.PurchaseStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.CancelPurchaseRequest;
import com.pos.dtos.response.PurchaseResponse;
import com.pos.entities.*;
import com.pos.repositories.*;
import com.pos.security.BranchAccessGuard;
import com.pos.services.impl.PurchaseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceImplTest {

    @Mock
    private PurchaseRepository purchaseRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StockMovementService stockMovementService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private UserRepository userRepository;
    private Authentication authentication;

    private PurchaseServiceImpl purchaseService;

    @BeforeEach
    void setUp() {
        UserContextService userContextService = new UserContextService(userRepository);
        BranchAccessGuard branchAccessGuard = new BranchAccessGuard();
        authentication = new UsernamePasswordAuthenticationToken("admin", null);
        purchaseService = new PurchaseServiceImpl(
                purchaseRepository,
                supplierRepository,
                branchRepository,
                productRepository,
                stockMovementService,
                auditLogService,
                userContextService,
                branchAccessGuard
        );
    }

    @Test
    void shouldFindPurchaseByIdSuccessfully() {
        UserEntity user = buildUser();
        PurchaseEntity purchase = buildPurchase(PurchaseStatus.CONFIRMED, 10);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(purchase));

        PurchaseResponse response = purchaseService.findById(1L, authentication);

        assertEquals(1L, response.id());
        assertEquals("PUR-1", response.purchaseCode());
    }

    @Test
    void shouldThrowNotFoundWhenPurchaseMissing() {
        UserEntity user = buildUser();
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(purchaseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> purchaseService.findById(99L, authentication));
    }

    @Test
    void shouldCancelPurchaseSuccessfully() {
        UserEntity user = buildUser();
        PurchaseEntity purchase = buildPurchase(PurchaseStatus.CONFIRMED, 10);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any(PurchaseEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseResponse response = purchaseService.cancel(1L, new CancelPurchaseRequest("H?y test"), authentication);

        assertEquals(PurchaseStatus.CANCELLED, response.status());
        assertEquals(5, purchase.getItems().get(0).getProduct().getStock());
        verify(stockMovementService).record(any(), any(), any(), any(), any(), any(), any(), any());
        verify(auditLogService).log(any(), any(), any(), any(), any());
    }

    @Test
    void shouldRejectCancelWhenAlreadyCancelled() {
        UserEntity user = buildUser();
        PurchaseEntity purchase = buildPurchase(PurchaseStatus.CANCELLED, 10);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(purchase));

        assertThrows(BadRequestException.class,
                () -> purchaseService.cancel(1L, new CancelPurchaseRequest("H?y l?i"), authentication));
    }

    @Test
    void shouldRejectCancelWhenStockBecomesNegative() {
        UserEntity user = buildUser();
        PurchaseEntity purchase = buildPurchase(PurchaseStatus.CONFIRMED, 2);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(purchase));

        assertThrows(BadRequestException.class,
                () -> purchaseService.cancel(1L, new CancelPurchaseRequest("?m kho"), authentication));
    }

    private UserEntity buildUser() {
        UserEntity user = new UserEntity();
        user.setUsername("admin");

        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setCode("CN-01");
        branch.setName("Branch");
        user.setBranch(branch);
        return user;
    }

    private PurchaseEntity buildPurchase(PurchaseStatus status, int currentStock) {
        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setCode("CN-01");
        branch.setName("Branch");

        SupplierEntity supplier = new SupplierEntity();
        supplier.setId(1L);
        supplier.setCode("NCC-01");
        supplier.setName("Supplier");

        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setSku("SP-01");
        product.setName("Coffee");
        product.setStock(currentStock);

        PurchaseItemEntity item = new PurchaseItemEntity();
        item.setProduct(product);
        item.setQuantity(5);
        item.setUnitCost(new BigDecimal("18000"));
        item.setLineTotal(new BigDecimal("90000"));

        PurchaseEntity purchase = new PurchaseEntity();
        purchase.setId(1L);
        purchase.setPurchaseCode("PUR-1");
        purchase.setBranch(branch);
        purchase.setSupplier(supplier);
        purchase.setStatus(status);
        purchase.setTotalAmount(new BigDecimal("90000"));
        purchase.setCreatedBy("admin");
        purchase.setItems(List.of(item));
        item.setPurchase(purchase);

        return purchase;
    }
}
