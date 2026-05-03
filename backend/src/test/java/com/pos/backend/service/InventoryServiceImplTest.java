package com.pos.backend.service;

import com.pos.backend.dto.InventoryAdjustmentPageResponse;
import com.pos.backend.dto.InventoryAdjustmentRequest;
import com.pos.backend.dto.InventoryAdjustmentResponse;
import com.pos.backend.dto.LowStockProductResponse;
import com.pos.backend.entity.InventoryAdjustmentEntity;
import com.pos.backend.entity.InventoryAdjustmentType;
import com.pos.backend.entity.ProductEntity;
import com.pos.backend.exception.BadRequestException;
import com.pos.backend.repository.InventoryAdjustmentRepository;
import com.pos.backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private InventoryAdjustmentRepository inventoryAdjustmentRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    @Test
    void shouldIncreaseInventorySuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setName("Coffee");
        productEntity.setSku("SP-001");
        productEntity.setStock(10);
        productEntity.setActive(true);

        InventoryAdjustmentRequest inventoryAdjustmentRequest = new InventoryAdjustmentRequest(
                1L, InventoryAdjustmentType.INCREASE, 5, "Restock", "note"
        );

        InventoryAdjustmentEntity inventoryAdjustmentEntity = new InventoryAdjustmentEntity();
        inventoryAdjustmentEntity.setId(1L);
        inventoryAdjustmentEntity.setProduct(productEntity);
        inventoryAdjustmentEntity.setAdjustmentType(InventoryAdjustmentType.INCREASE);
        inventoryAdjustmentEntity.setQuantity(5);
        inventoryAdjustmentEntity.setReason("Restock");
        inventoryAdjustmentEntity.setCreatedBy("admin");

        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(productEntity));
        when(productRepository.save(any(ProductEntity.class))).thenReturn(productEntity);
        when(inventoryAdjustmentRepository.save(any(InventoryAdjustmentEntity.class))).thenReturn(inventoryAdjustmentEntity);

        InventoryAdjustmentResponse inventoryAdjustmentResponse = inventoryService.adjustInventory(inventoryAdjustmentRequest, "admin");

        assertEquals(15, inventoryAdjustmentResponse.currentStock());
        assertEquals(InventoryAdjustmentType.INCREASE, inventoryAdjustmentResponse.adjustmentType());
    }

    @Test
    void shouldThrowBadRequestWhenDecreaseInventoryBelowZero() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setStock(2);
        productEntity.setActive(true);

        InventoryAdjustmentRequest inventoryAdjustmentRequest = new InventoryAdjustmentRequest(
                1L, InventoryAdjustmentType.DECREASE, 5, "Damage", "note"
        );

        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(productEntity));

        assertThrows(BadRequestException.class, () -> inventoryService.adjustInventory(inventoryAdjustmentRequest, "admin"));
    }

    @Test
    void shouldFindAdjustmentsSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setName("Coffee");
        productEntity.setStock(10);

        InventoryAdjustmentEntity inventoryAdjustmentEntity = new InventoryAdjustmentEntity();
        inventoryAdjustmentEntity.setId(1L);
        inventoryAdjustmentEntity.setProduct(productEntity);
        inventoryAdjustmentEntity.setAdjustmentType(InventoryAdjustmentType.INCREASE);
        inventoryAdjustmentEntity.setQuantity(5);
        inventoryAdjustmentEntity.setReason("Restock");
        inventoryAdjustmentEntity.setCreatedBy("admin");

        Page<InventoryAdjustmentEntity> adjustmentPage = new PageImpl<>(List.of(inventoryAdjustmentEntity));
        when(inventoryAdjustmentRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(adjustmentPage);

        InventoryAdjustmentPageResponse inventoryAdjustmentPageResponse = inventoryService.findAdjustments(0, 20, null, null, null, null);

        assertEquals(1, inventoryAdjustmentPageResponse.content().size());
        assertEquals(1, inventoryAdjustmentPageResponse.totalElements());
    }

    @Test
    void shouldFindLowStockProductsSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setName("Coffee");
        productEntity.setSku("SP-001");
        productEntity.setStock(3);
        productEntity.setActive(true);

        when(productRepository.findByActiveTrueAndStockLessThanEqualOrderByStockAsc(10)).thenReturn(List.of(productEntity));

        List<LowStockProductResponse> lowStockProducts = inventoryService.findLowStockProducts(10);

        assertEquals(1, lowStockProducts.size());
        assertEquals("LOW_STOCK", lowStockProducts.get(0).status());
    }
}
