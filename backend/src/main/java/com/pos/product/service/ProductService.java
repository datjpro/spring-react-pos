package com.pos.product.service;

import com.pos.product.dto.CreateProductRequest;
import com.pos.product.dto.ProductPageResponse;
import com.pos.product.dto.ProductResponse;
import com.pos.product.dto.UpdateProductRequest;

import java.util.List;

public interface ProductService {

    ProductPageResponse findProducts(int page, int size, String search, String category, String sort, String order);

    ProductResponse createProduct(CreateProductRequest createProductRequest);

    ProductResponse findProductById(Long productId);

    ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest);

    void deleteProduct(Long productId);

    List<String> findCategories();
}
