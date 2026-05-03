package com.pos.product.service;

import com.pos.product.dto.CreateProductRequest;
import com.pos.product.dto.ProductPageResponse;
import com.pos.product.dto.ProductResponse;
import com.pos.product.dto.UpdateProductRequest;
import com.pos.product.entity.ProductEntity;
import com.pos.common.exception.DuplicateResourceException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void shouldCreateProductSuccessfully() {
        CreateProductRequest createProductRequest = new CreateProductRequest(
                "SP-001", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"),
                50, "pack", "123456", "desc", "https://img"
        );

        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setSku("SP-001");
        productEntity.setName("Coffee");
        productEntity.setCategory("Drink");
        productEntity.setPrice(new BigDecimal("100000"));
        productEntity.setCost(new BigDecimal("80000"));
        productEntity.setStock(50);
        productEntity.setUnit("pack");
        productEntity.setActive(true);

        when(productRepository.existsBySkuIgnoreCase("SP-001")).thenReturn(false);
        when(productRepository.save(any(ProductEntity.class))).thenReturn(productEntity);

        ProductResponse productResponse = productService.createProduct(createProductRequest);
        assertEquals("SP-001", productResponse.sku());
        assertEquals("Coffee", productResponse.name());
    }

    @Test
    void shouldThrowDuplicateResourceWhenSkuExists() {
        CreateProductRequest createProductRequest = new CreateProductRequest(
                "SP-001", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"),
                50, "pack", "123456", "desc", "https://img"
        );
        when(productRepository.existsBySkuIgnoreCase("SP-001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.createProduct(createProductRequest));
    }

    @Test
    void shouldFindProductByIdSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setSku("SP-001");
        productEntity.setName("Coffee");
        productEntity.setActive(true);

        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(productEntity));

        ProductResponse productResponse = productService.findProductById(1L);
        assertEquals("SP-001", productResponse.sku());
    }

    @Test
    void shouldThrowResourceNotFoundWhenProductMissing() {
        when(productRepository.findByIdAndActiveTrue(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> productService.findProductById(99L));
    }

    @Test
    void shouldSoftDeleteProductSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setActive(true);

        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(productEntity));

        productService.deleteProduct(1L);

        assertFalse(productEntity.isActive());
        verify(productRepository).save(productEntity);
    }

    @Test
    void shouldFindProductsWithPagingSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setSku("SP-001");
        productEntity.setName("Coffee");
        productEntity.setActive(true);

        Page<ProductEntity> productPage = new PageImpl<>(List.of(productEntity));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);

        ProductPageResponse productPageResponse = productService.findProducts(0, 20, "coffee", null, "name", "asc");

        assertEquals(1, productPageResponse.content().size());
        assertEquals(1, productPageResponse.totalElements());
    }

    @Test
    void shouldUpdateProductSuccessfully() {
        ProductEntity productEntity = new ProductEntity();
        productEntity.setId(1L);
        productEntity.setSku("SP-001");
        productEntity.setName("Old Name");
        productEntity.setActive(true);

        UpdateProductRequest updateProductRequest = new UpdateProductRequest(
                "New Name", "Drink", new BigDecimal("120000"), new BigDecimal("90000"),
                55, "pack", "999", "updated", "https://img", true
        );

        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(productEntity));
        when(productRepository.save(any(ProductEntity.class))).thenReturn(productEntity);

        ProductResponse productResponse = productService.updateProduct(1L, updateProductRequest);

        assertEquals("New Name", productResponse.name());
        assertTrue(productResponse.active());
    }
}
