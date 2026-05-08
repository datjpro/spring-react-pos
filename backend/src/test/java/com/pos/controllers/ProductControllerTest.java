package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dtos.request.CreateProductRequest;
import com.pos.dtos.response.ProductPageResponse;
import com.pos.dtos.response.ProductResponse;
import com.pos.dtos.request.UpdateProductRequest;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.services.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldFindProductsSuccessfully() throws Exception {
        ProductResponse productResponse = new ProductResponse(
                1L, "OW-SM-BLU-L", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"), 10,
                "pack", "123", "desc", "https://img", true, Instant.now()
        );
        ProductPageResponse productPageResponse = new ProductPageResponse(List.of(productResponse), 1, 1, 0, 20);

        when(productService.findProducts(0, 20, null, null, "name", "asc")).thenReturn(productPageResponse);

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldCreateProductSuccessfully() throws Exception {
        CreateProductRequest createProductRequest = new CreateProductRequest(
                "OW-SM-BLU-L", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"),
                50, "pack", "123456", "desc", "https://img"
        );
        ProductResponse productResponse = new ProductResponse(
                1L, "OW-SM-BLU-L", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"), 50,
                "pack", "123456", "desc", "https://img", true, Instant.now()
        );

        when(productService.createProduct(any(CreateProductRequest.class))).thenReturn(productResponse);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createProductRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("OW-SM-BLU-L"));
    }

    @Test
    void shouldRejectCreateProductWhenSkuInvalidFormat() throws Exception {
        CreateProductRequest createProductRequest = new CreateProductRequest(
                "sku_demo_001", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"),
                50, "pack", "123456", "desc", "https://img"
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createProductRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void shouldFindProductByIdSuccessfully() throws Exception {
        ProductResponse productResponse = new ProductResponse(
                1L, "OW-SM-BLU-L", "Coffee", "Drink", new BigDecimal("100000"), new BigDecimal("80000"), 50,
                "pack", "123456", "desc", "https://img", true, Instant.now()
        );
        when(productService.findProductById(1L)).thenReturn(productResponse);

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldUpdateProductSuccessfully() throws Exception {
        UpdateProductRequest updateProductRequest = new UpdateProductRequest(
                "Coffee Updated", "Drink", new BigDecimal("110000"), new BigDecimal("85000"),
                55, "pack", "123456", "desc", "https://img", true
        );
        ProductResponse productResponse = new ProductResponse(
                1L, "OW-SM-BLU-L", "Coffee Updated", "Drink", new BigDecimal("110000"), new BigDecimal("85000"), 55,
                "pack", "123456", "desc", "https://img", true, Instant.now()
        );
        when(productService.updateProduct(any(Long.class), any(UpdateProductRequest.class))).thenReturn(productResponse);

        mockMvc.perform(put("/api/v1/products/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateProductRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Coffee Updated"));
    }

    @Test
    void shouldDeleteProductSuccessfully() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa sản phẩm thành công."));
    }

    @Test
    void shouldFindCategoriesSuccessfully() throws Exception {
        when(productService.findCategories()).thenReturn(List.of("Drink", "Food"));

        mockMvc.perform(get("/api/v1/products/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Drink"));
    }
}
