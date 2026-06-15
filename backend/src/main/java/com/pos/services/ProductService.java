package com.pos.services;

import com.pos.dtos.request.CreateProductRequest;
import com.pos.dtos.response.ProductPageResponse;
import com.pos.dtos.response.ProductResponse;
import com.pos.dtos.request.UpdateProductRequest;

import java.util.List;

public interface ProductService {

    ProductPageResponse findProducts(int page, int size, String search, String category, String sort, String order);

    ProductResponse createProduct(CreateProductRequest createProductRequest);

    ProductResponse findProductById(Long productId);

    ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest);

    void deleteProduct(Long productId);

    List<String> findCategories();
}
