package com.pos.services;

import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.dtos.response.StockLevelPageResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.BranchProductStockEntity;
import com.pos.entities.ProductEntity;
import com.pos.entities.UserEntity;
import com.pos.repositories.BranchProductStockRepository;
import com.pos.repositories.BranchRepository;
import com.pos.repositories.ProductRepository;
import com.pos.security.BranchAccessGuard;
import com.pos.services.impl.BranchProductStockServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BranchProductStockServiceImplTest {

    @Mock
    private BranchProductStockRepository branchProductStockRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private ProductRepository productRepository;

    private BranchProductStockServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BranchProductStockServiceImpl(branchProductStockRepository, branchRepository, productRepository, new BranchAccessGuard());
    }

    @Test
    void shouldAdjustBranchStockAndSyncProductTotal() {
        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setName("Coffee");
        product.setSku("SP-01");
        product.setStock(10);
        product.setActive(true);

        BranchEntity branch = new BranchEntity();
        branch.setId(2L);
        branch.setName("CN-02");
        branch.setActive(true);

        BranchProductStockEntity branchProductStock = new BranchProductStockEntity();
        branchProductStock.setProduct(product);
        branchProductStock.setBranch(branch);
        branchProductStock.setStock(4);

        when(productRepository.findByIdAndActiveTrueForUpdate(1L)).thenReturn(Optional.of(product));
        when(branchProductStockRepository.findByProductIdAndBranchIdForUpdate(1L, 2L)).thenReturn(Optional.of(branchProductStock));
        when(branchProductStockRepository.save(any(BranchProductStockEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        int nextStock = service.adjustStock(product, branch, -3);

        assertEquals(1, nextStock);
        assertEquals(7, product.getStock());
        assertEquals(1, branchProductStock.getStock());
    }

    @Test
    void shouldRejectNegativeBranchStock() {
        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setStock(10);
        product.setActive(true);

        BranchEntity branch = new BranchEntity();
        branch.setId(2L);
        branch.setActive(true);

        BranchProductStockEntity branchProductStock = new BranchProductStockEntity();
        branchProductStock.setProduct(product);
        branchProductStock.setBranch(branch);
        branchProductStock.setStock(2);

        when(productRepository.findByIdAndActiveTrueForUpdate(1L)).thenReturn(Optional.of(product));
        when(branchProductStockRepository.findByProductIdAndBranchIdForUpdate(1L, 2L)).thenReturn(Optional.of(branchProductStock));

        assertThrows(BadRequestException.class, () -> service.adjustStock(product, branch, -3));
    }

    @Test
    void shouldReturnStockLevelsWithinUserBranchScope() {
        UserEntity user = new UserEntity();
        user.setRole(Role.MANAGER);
        BranchEntity userBranch = new BranchEntity();
        userBranch.setId(2L);
        user.setBranch(userBranch);

        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setName("Coffee");
        product.setSku("SP-01");
        product.setActive(true);

        BranchEntity branch = new BranchEntity();
        branch.setId(2L);
        branch.setName("CN-02");
        branch.setActive(true);

        BranchProductStockEntity branchProductStock = new BranchProductStockEntity();
        branchProductStock.setProduct(product);
        branchProductStock.setBranch(branch);
        branchProductStock.setStock(9);

        when(branchProductStockRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(branchProductStock)));

        StockLevelPageResponse response = service.findStockLevels(user, null, null, 0, 20);

        assertEquals(1, response.totalElements());
        assertEquals(2L, response.content().get(0).branchId());
        assertEquals(9, response.content().get(0).stock());
    }

    @Test
    void shouldRejectAccessToOtherBranchForManager() {
        UserEntity user = new UserEntity();
        user.setRole(Role.MANAGER);
        BranchEntity userBranch = new BranchEntity();
        userBranch.setId(2L);
        user.setBranch(userBranch);

        assertThrows(AccessDeniedException.class, () -> service.findStockLevels(user, 3L, null, 0, 20));
    }
}
