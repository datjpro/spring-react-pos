package com.pos.backend.service;

import com.pos.backend.dto.InventoryAdjustmentPageResponse;
import com.pos.backend.dto.InventoryAdjustmentRequest;
import com.pos.backend.dto.InventoryAdjustmentResponse;
import com.pos.backend.dto.LowStockProductResponse;
import com.pos.backend.entity.InventoryAdjustmentEntity;
import com.pos.backend.entity.InventoryAdjustmentType;
import com.pos.backend.entity.ProductEntity;
import com.pos.backend.exception.BadRequestException;
import com.pos.backend.exception.ResourceNotFoundException;
import com.pos.backend.repository.InventoryAdjustmentRepository;
import com.pos.backend.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryAdjustmentRepository inventoryAdjustmentRepository;
    private final ProductRepository productRepository;

    public InventoryServiceImpl(InventoryAdjustmentRepository inventoryAdjustmentRepository,
                                ProductRepository productRepository) {
        this.inventoryAdjustmentRepository = inventoryAdjustmentRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public InventoryAdjustmentResponse adjustInventory(InventoryAdjustmentRequest inventoryAdjustmentRequest, String username) {
        ProductEntity productEntity = productRepository.findByIdAndActiveTrue(inventoryAdjustmentRequest.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        int currentStock = productEntity.getStock();
        int quantity = inventoryAdjustmentRequest.quantity();

        if (inventoryAdjustmentRequest.adjustmentType() == InventoryAdjustmentType.DECREASE) {
            if (currentStock < quantity) {
                throw new BadRequestException("Insufficient stock for decrease adjustment");
            }
            productEntity.setStock(currentStock - quantity);
        } else {
            productEntity.setStock(currentStock + quantity);
        }

        productRepository.save(productEntity);

        InventoryAdjustmentEntity inventoryAdjustmentEntity = new InventoryAdjustmentEntity();
        inventoryAdjustmentEntity.setProduct(productEntity);
        inventoryAdjustmentEntity.setAdjustmentType(inventoryAdjustmentRequest.adjustmentType());
        inventoryAdjustmentEntity.setQuantity(quantity);
        inventoryAdjustmentEntity.setReason(inventoryAdjustmentRequest.reason());
        inventoryAdjustmentEntity.setNote(inventoryAdjustmentRequest.note());
        inventoryAdjustmentEntity.setCreatedBy(username);

        InventoryAdjustmentEntity savedInventoryAdjustment = inventoryAdjustmentRepository.save(inventoryAdjustmentEntity);
        return mapToResponse(savedInventoryAdjustment, productEntity.getStock());
    }

    @Override
    public InventoryAdjustmentPageResponse findAdjustments(int page,
                                                           int size,
                                                           Long productId,
                                                           InventoryAdjustmentType adjustmentType,
                                                           Instant from,
                                                           Instant to) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<InventoryAdjustmentEntity> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (productId != null) {
                predicates.add(criteriaBuilder.equal(root.get("product").get("id"), productId));
            }
            if (adjustmentType != null) {
                predicates.add(criteriaBuilder.equal(root.get("adjustmentType"), adjustmentType));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<InventoryAdjustmentEntity> adjustmentPage = inventoryAdjustmentRepository.findAll(specification, pageable);

        List<InventoryAdjustmentResponse> content = adjustmentPage.getContent().stream()
                .map(adjustment -> mapToResponse(adjustment, adjustment.getProduct().getStock()))
                .toList();

        return new InventoryAdjustmentPageResponse(
                content,
                adjustmentPage.getTotalElements(),
                adjustmentPage.getTotalPages(),
                adjustmentPage.getNumber(),
                adjustmentPage.getSize()
        );
    }

    @Override
    public List<LowStockProductResponse> findLowStockProducts(int threshold) {
        List<ProductEntity> products = productRepository.findByActiveTrueAndStockLessThanEqualOrderByStockAsc(threshold);
        return products.stream()
                .map(productEntity -> new LowStockProductResponse(
                        productEntity.getId(),
                        productEntity.getSku(),
                        productEntity.getName(),
                        productEntity.getStock(),
                        threshold,
                        productEntity.getStock() == 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
                ))
                .toList();
    }

    private InventoryAdjustmentResponse mapToResponse(InventoryAdjustmentEntity inventoryAdjustmentEntity, Integer currentStock) {
        return new InventoryAdjustmentResponse(
                inventoryAdjustmentEntity.getId(),
                inventoryAdjustmentEntity.getProduct().getId(),
                inventoryAdjustmentEntity.getProduct().getName(),
                inventoryAdjustmentEntity.getAdjustmentType(),
                inventoryAdjustmentEntity.getQuantity(),
                inventoryAdjustmentEntity.getReason(),
                inventoryAdjustmentEntity.getNote(),
                currentStock,
                inventoryAdjustmentEntity.getCreatedBy(),
                inventoryAdjustmentEntity.getCreatedAt()
        );
    }
}
