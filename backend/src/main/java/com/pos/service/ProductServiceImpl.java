package com.pos.service;

import com.pos.dto.request.CreateProductRequest;
import com.pos.dto.response.ProductPageResponse;
import com.pos.dto.response.ProductResponse;
import com.pos.dto.request.UpdateProductRequest;
import com.pos.entity.ProductEntity;
import com.pos.common.exception.DuplicateResourceException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ProductServiceImpl implements ProductService {

    private static final List<String> ALLOWED_SORT_FIELDS = List.of("name", "price", "stock", "createdAt");

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public ProductPageResponse findProducts(int page, int size, String search, String category, String sort, String order) {
        String sortField = ALLOWED_SORT_FIELDS.contains(sort) ? sort : "name";
        Sort.Direction direction = "desc".equalsIgnoreCase(order) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Specification<ProductEntity> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("active")));

            if (search != null && !search.isBlank()) {
                String likeKeyword = "%" + search.toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), likeKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), likeKeyword)
                ));
            }

            if (category != null && !category.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<ProductEntity> productPage = productRepository.findAll(specification, pageable);

        List<ProductResponse> content = productPage.getContent().stream()
                .map(this::mapToProductResponse)
                .toList();

        return new ProductPageResponse(
                content,
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.getNumber(),
                productPage.getSize()
        );
    }

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest createProductRequest) {
        if (productRepository.existsBySkuIgnoreCase(createProductRequest.sku())) {
            throw new DuplicateResourceException("SKU already exists");
        }

        ProductEntity productEntity = new ProductEntity();
        productEntity.setSku(createProductRequest.sku());
        productEntity.setName(createProductRequest.name());
        productEntity.setCategory(createProductRequest.category());
        productEntity.setPrice(createProductRequest.price());
        productEntity.setCost(createProductRequest.cost());
        productEntity.setStock(createProductRequest.stock());
        productEntity.setUnit(createProductRequest.unit());
        productEntity.setBarcode(createProductRequest.barcode());
        productEntity.setDescription(createProductRequest.description());
        productEntity.setImageUrl(createProductRequest.imageUrl());
        productEntity.setActive(true);

        ProductEntity savedProduct = productRepository.save(productEntity);
        return mapToProductResponse(savedProduct);
    }

    @Override
    public ProductResponse findProductById(Long productId) {
        ProductEntity productEntity = findActiveProductById(productId);
        return mapToProductResponse(productEntity);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest) {
        ProductEntity productEntity = findActiveProductById(productId);
        productEntity.setName(updateProductRequest.name());
        productEntity.setCategory(updateProductRequest.category());
        productEntity.setPrice(updateProductRequest.price());
        productEntity.setCost(updateProductRequest.cost());
        productEntity.setStock(updateProductRequest.stock());
        productEntity.setUnit(updateProductRequest.unit());
        productEntity.setBarcode(updateProductRequest.barcode());
        productEntity.setDescription(updateProductRequest.description());
        productEntity.setImageUrl(updateProductRequest.imageUrl());
        productEntity.setActive(updateProductRequest.active());

        ProductEntity savedProduct = productRepository.save(productEntity);
        return mapToProductResponse(savedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        ProductEntity productEntity = findActiveProductById(productId);
        productEntity.setActive(false);
        productRepository.save(productEntity);
    }

    @Override
    public List<String> findCategories() {
        return productRepository.findDistinctActiveCategories();
    }

    private ProductEntity findActiveProductById(Long productId) {
        return productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private ProductResponse mapToProductResponse(ProductEntity productEntity) {
        return new ProductResponse(
                productEntity.getId(),
                productEntity.getSku(),
                productEntity.getName(),
                productEntity.getCategory(),
                productEntity.getPrice(),
                productEntity.getCost(),
                productEntity.getStock(),
                productEntity.getUnit(),
                productEntity.getBarcode(),
                productEntity.getDescription(),
                productEntity.getImageUrl(),
                productEntity.isActive(),
                productEntity.getCreatedAt()
        );
    }
}
