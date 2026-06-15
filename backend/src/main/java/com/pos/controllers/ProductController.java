package com.pos.controllers;

import com.pos.dtos.request.CreateProductRequest;
import com.pos.common.dto.MessageResponse;
import com.pos.dtos.response.ProductPageResponse;
import com.pos.dtos.response.ProductResponse;
import com.pos.dtos.request.UpdateProductRequest;
import com.pos.services.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Product catalog management")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "List products", description = "Get products with pagination, filter and sorting")
    public ResponseEntity<ProductPageResponse> findProducts(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size must be greater than or equal to 1") @Max(value = 100, message = "size must be less than or equal to 100") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String order) {
        return ResponseEntity.ok(productService.findProducts(page, size, search, category, sort, order));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping
    @Operation(summary = "Create product", description = "Create new product")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest createProductRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(createProductRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product detail", description = "Get product by id")
    public ResponseEntity<ProductResponse> findProductById(@PathVariable("id") @Min(value = 1, message = "productId must be greater than 0") Long productId) {
        return ResponseEntity.ok(productService.findProductById(productId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Update product fields by id")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable("id") @Min(value = 1, message = "productId must be greater than 0") Long productId,
                                                         @Valid @RequestBody UpdateProductRequest updateProductRequest) {
        return ResponseEntity.ok(productService.updateProduct(productId, updateProductRequest));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Soft delete product by id")
    public ResponseEntity<MessageResponse> deleteProduct(@PathVariable("id") @Min(value = 1, message = "productId must be greater than 0") Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.ok(new MessageResponse("Xóa sản phẩm thành công."));
    }

    @GetMapping("/categories")
    @Operation(summary = "List categories", description = "Get distinct active product categories")
    public ResponseEntity<List<String>> findCategories() {
        return ResponseEntity.ok(productService.findCategories());
    }
}
