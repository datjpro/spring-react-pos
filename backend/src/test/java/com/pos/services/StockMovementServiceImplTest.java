package com.pos.services;

import com.pos.common.enums.MovementType;
import com.pos.dtos.response.StockMovementResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.ProductEntity;
import com.pos.entities.StockMovementEntity;
import com.pos.repositories.StockMovementRepository;
import com.pos.services.impl.StockMovementServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockMovementServiceImplTest {

    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private StockMovementServiceImpl stockMovementService;

    @Test
    void shouldRecordStockMovementSuccessfully() {
        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setName("Coffee");

        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setName("Branch");

        stockMovementService.record(product, branch, MovementType.IN, 5, "PURCHASE", 1L, "note", "admin");

        verify(stockMovementRepository).save(any(StockMovementEntity.class));
    }

    @Test
    void shouldFindMovementsByBranchSuccessfully() {
        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setName("Coffee");

        BranchEntity branch = new BranchEntity();
        branch.setId(1L);
        branch.setName("Branch");

        StockMovementEntity movement = new StockMovementEntity();
        movement.setId(1L);
        movement.setProduct(product);
        movement.setBranch(branch);
        movement.setMovementType(MovementType.IN);
        movement.setQuantity(5);
        movement.setReferenceType("PURCHASE");
        movement.setReferenceId(1L);
        movement.setNote("note");
        movement.setCreatedBy("admin");

        when(stockMovementRepository.findByBranchIdOrderByCreatedAtDesc(any(), any()))
                .thenReturn(new PageImpl<>(List.of(movement)));

        var page = stockMovementService.findByBranch(1L, 0, 20);

        assertEquals(1, page.getTotalElements());
        StockMovementResponse response = page.getContent().get(0);
        assertEquals("Coffee", response.productName());
    }
}
