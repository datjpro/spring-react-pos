package com.pos.service;

import com.pos.dto.request.CreateProductRequest;
import com.pos.dto.response.ProductPageResponse;
import com.pos.dto.response.ProductResponse;
import com.pos.dto.request.UpdateProductRequest;

import java.util.List;

public interface ProductService {

    ProductPageResponse findProducts(int page, int size, String search, String category, String sort, String order);

    ProductResponse createProduct(CreateProductRequest createProductRequest);

    ProductResponse findProductById(Long productId);

    ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest);

    void deleteProduct(Long productId);

    List<String> findCategories();
}
