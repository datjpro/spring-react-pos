package com.pos.backend.service;

import com.pos.backend.dto.CreateProductRequest;
import com.pos.backend.dto.ProductPageResponse;
import com.pos.backend.dto.ProductResponse;
import com.pos.backend.dto.UpdateProductRequest;

import java.util.List;

public interface ProductService {

    ProductPageResponse findProducts(int page, int size, String search, String category, String sort, String order);

    ProductResponse createProduct(CreateProductRequest createProductRequest);

    ProductResponse findProductById(Long productId);

    ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest);

    void deleteProduct(Long productId);

    List<String> findCategories();
}
