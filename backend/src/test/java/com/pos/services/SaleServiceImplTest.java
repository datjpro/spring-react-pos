package com.pos.services;

import com.pos.common.enums.SaleStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.CancelSaleRequest;
import com.pos.dtos.response.SaleResponse;
import com.pos.entities.*;
import com.pos.repositories.*;
import com.pos.security.BranchAccessGuard;
import com.pos.services.impl.SaleServiceImpl;
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
class SaleServiceImplTest {

    @Mock
    private SaleRepository saleRepository;
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
    private SaleServiceImpl saleService;

    @BeforeEach
    void setUp() {
        UserContextService userContextService = new UserContextService(userRepository);
        BranchAccessGuard branchAccessGuard = new BranchAccessGuard();
        authentication = new UsernamePasswordAuthenticationToken("admin", null);
        saleService = new SaleServiceImpl(
                saleRepository,
                branchRepository,
                productRepository,
                stockMovementService,
                auditLogService,
                userContextService,
                branchAccessGuard
        );
    }

    @Test
    void shouldFindSaleByIdSuccessfully() {
        UserEntity user = buildUser();
        SaleEntity sale = buildSale(SaleStatus.COMPLETED, 3);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        SaleResponse response = saleService.findById(1L, authentication);

        assertEquals(1L, response.id());
        assertEquals("SAL-1", response.saleCode());
    }

    @Test
    void shouldThrowNotFoundWhenSaleMissing() {
        UserEntity user = buildUser();
        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(saleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> saleService.findById(99L, authentication));
    }

    @Test
    void shouldCancelSaleSuccessfully() {
        UserEntity user = buildUser();
        SaleEntity sale = buildSale(SaleStatus.COMPLETED, 3);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(SaleEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleResponse response = saleService.cancel(1L, new CancelSaleRequest("H?y test"), authentication);

        assertEquals(SaleStatus.CANCELLED, response.status());
        assertEquals(5, sale.getItems().get(0).getProduct().getStock());
        verify(stockMovementService).record(any(), any(), any(), any(), any(), any(), any(), any());
        verify(auditLogService).log(any(), any(), any(), any(), any());
    }

    @Test
    void shouldRejectCancelWhenAlreadyCancelled() {
        UserEntity user = buildUser();
        SaleEntity sale = buildSale(SaleStatus.CANCELLED, 3);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(user));
        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        assertThrows(BadRequestException.class,
                () -> saleService.cancel(1L, new CancelSaleRequest("H?y l?i"), authentication));
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

    private SaleEntity buildSale(SaleStatus status, int currentStock) {
        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setCode("CN-01");
        branch.setName("Branch");

        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setSku("SP-01");
        product.setName("Coffee");
        product.setStock(currentStock);
        product.setPrice(new BigDecimal("25000"));

        SaleItemEntity item = new SaleItemEntity();
        item.setProduct(product);
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("25000"));
        item.setLineTotal(new BigDecimal("50000"));

        SaleEntity sale = new SaleEntity();
        sale.setId(1L);
        sale.setSaleCode("SAL-1");
        sale.setBranch(branch);
        sale.setStatus(status);
        sale.setTotalAmount(new BigDecimal("50000"));
        sale.setCreatedBy("admin");
        sale.setItems(List.of(item));
        item.setSale(sale);
        return sale;
    }
}
