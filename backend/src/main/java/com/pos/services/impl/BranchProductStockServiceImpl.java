package com.pos.services.impl;

import com.pos.common.exception.BadRequestException;
import com.pos.dtos.response.StockLevelPageResponse;
import com.pos.dtos.response.StockLevelResponse;
import com.pos.entities.BranchEntity;
import com.pos.entities.BranchProductStockEntity;
import com.pos.entities.ProductEntity;
import com.pos.entities.UserEntity;
import com.pos.repositories.BranchProductStockRepository;
import com.pos.repositories.BranchRepository;
import com.pos.repositories.ProductRepository;
import com.pos.security.BranchAccessGuard;
import com.pos.services.BranchProductStockService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BranchProductStockServiceImpl implements BranchProductStockService {

    private final BranchProductStockRepository branchProductStockRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final BranchAccessGuard branchAccessGuard;

    public BranchProductStockServiceImpl(BranchProductStockRepository branchProductStockRepository,
                                         BranchRepository branchRepository,
                                         ProductRepository productRepository,
                                         BranchAccessGuard branchAccessGuard) {
        this.branchProductStockRepository = branchProductStockRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.branchAccessGuard = branchAccessGuard;
    }

    @Override
    @Transactional
    public int adjustStock(ProductEntity product, BranchEntity branch, int quantityDelta) {
        ProductEntity lockedProduct = productRepository.findByIdAndActiveTrueForUpdate(product.getId())
                .orElseThrow(() -> new BadRequestException("Product not found"));

        BranchProductStockEntity branchProductStock = branchProductStockRepository
                .findByProductIdAndBranchIdForUpdate(lockedProduct.getId(), branch.getId())
                .orElseGet(() -> createZeroStockRow(lockedProduct, branch));

        int nextBranchStock = branchProductStock.getStock() + quantityDelta;
        if (nextBranchStock < 0) {
            throw new BadRequestException("Insufficient stock for branch");
        }

        branchProductStock.setStock(nextBranchStock);
        branchProductStockRepository.save(branchProductStock);

        lockedProduct.setStock(Math.addExact(lockedProduct.getStock(), quantityDelta));
        if (lockedProduct.getStock() < 0) {
            throw new BadRequestException("Total stock cannot be negative");
        }
        productRepository.save(lockedProduct);
        product.setStock(lockedProduct.getStock());
        return nextBranchStock;
    }

    @Override
    @Transactional
    public void syncTotalStockToDefaultBranch(ProductEntity product, int targetTotalStock) {
        ProductEntity lockedProduct = productRepository.findByIdAndActiveTrueForUpdate(product.getId())
                .orElseThrow(() -> new BadRequestException("Product not found"));

        BranchEntity defaultBranch = branchRepository.findFirstByActiveTrueOrderByIdAsc()
                .or(() -> branchRepository.findFirstByOrderByIdAsc())
                .orElse(null);
        if (defaultBranch == null) {
            lockedProduct.setStock(targetTotalStock);
            productRepository.save(lockedProduct);
            product.setStock(targetTotalStock);
            return;
        }

        BranchProductStockEntity branchProductStock = branchProductStockRepository
                .findByProductIdAndBranchIdForUpdate(lockedProduct.getId(), defaultBranch.getId())
                .orElseGet(() -> createZeroStockRow(lockedProduct, defaultBranch));

        int delta = targetTotalStock - lockedProduct.getStock();
        int nextBranchStock = branchProductStock.getStock() + delta;
        if (nextBranchStock < 0) {
            throw new BadRequestException("Default branch stock cannot be negative");
        }

        branchProductStock.setStock(nextBranchStock);
        branchProductStockRepository.save(branchProductStock);
        lockedProduct.setStock(targetTotalStock);
        productRepository.save(lockedProduct);
        product.setStock(targetTotalStock);
    }

    @Override
    @Transactional(readOnly = true)
    public StockLevelPageResponse findStockLevels(UserEntity user, Long branchId, Long productId, int page, int size) {
        Long resolvedBranchId = branchId;
        if (user.getRole() != com.pos.common.enums.Role.ADMIN) {
            if (user.getBranch() == null || user.getBranch().getId() == null) {
                throw new BadRequestException("User branch scope is required");
            }
            resolvedBranchId = resolvedBranchId == null ? user.getBranch().getId() : resolvedBranchId;
            branchAccessGuard.requireBranchAccess(user, resolvedBranchId);
        }
        final Long resolvedBranchIdFinal = resolvedBranchId;
        final Long productIdFinal = productId;

        Pageable pageable = PageRequest.of(page, size, Sort.by("product.name").ascending());
        Specification<BranchProductStockEntity> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (resolvedBranchIdFinal != null) {
                predicates.add(criteriaBuilder.equal(root.get("branch").get("id"), resolvedBranchIdFinal));
            }
            if (productIdFinal != null) {
                predicates.add(criteriaBuilder.equal(root.get("product").get("id"), productIdFinal));
            }
            predicates.add(criteriaBuilder.isTrue(root.get("branch").get("active")));
            predicates.add(criteriaBuilder.isTrue(root.get("product").get("active")));
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<BranchProductStockEntity> stockPage = branchProductStockRepository.findAll(specification, pageable);
        List<StockLevelResponse> content = stockPage.getContent().stream()
                .map(this::map)
                .toList();
        return new StockLevelPageResponse(content, stockPage.getTotalElements(), stockPage.getTotalPages(),
                stockPage.getNumber(), stockPage.getSize());
    }

    private BranchProductStockEntity createZeroStockRow(ProductEntity product, BranchEntity branch) {
        BranchProductStockEntity branchProductStock = new BranchProductStockEntity();
        branchProductStock.setProduct(product);
        branchProductStock.setBranch(branch);
        branchProductStock.setStock(0);
        try {
            return branchProductStockRepository.saveAndFlush(branchProductStock);
        } catch (DataIntegrityViolationException duplicateRowException) {
            return branchProductStockRepository.findByProductIdAndBranchIdForUpdate(product.getId(), branch.getId())
                    .orElseThrow(() -> duplicateRowException);
        }
    }

    private StockLevelResponse map(BranchProductStockEntity branchProductStock) {
        return new StockLevelResponse(
                branchProductStock.getProduct().getId(),
                branchProductStock.getProduct().getName(),
                branchProductStock.getProduct().getSku(),
                branchProductStock.getBranch().getId(),
                branchProductStock.getBranch().getName(),
                branchProductStock.getStock()
        );
    }
}
