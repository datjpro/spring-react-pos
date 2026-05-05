package com.pos.service.impl;

import com.pos.service.*;

import com.pos.entity.BranchEntity;
import com.pos.common.enums.MovementType;
import com.pos.entity.ProductEntity;
import com.pos.dto.response.StockMovementResponse;
import com.pos.entity.StockMovementEntity;
import com.pos.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class StockMovementServiceImpl implements StockMovementService {
    private final StockMovementRepository stockMovementRepository;

    public StockMovementServiceImpl(StockMovementRepository stockMovementRepository) {
        this.stockMovementRepository = stockMovementRepository;
    }

    public void record(ProductEntity product, BranchEntity branch, MovementType type, Integer quantity,
            String referenceType, Long referenceId, String note, String actor) {
        StockMovementEntity m = new StockMovementEntity();
        m.setProduct(product);
        m.setBranch(branch);
        m.setMovementType(type);
        m.setQuantity(quantity);
        m.setReferenceType(referenceType);
        m.setReferenceId(referenceId);
        m.setNote(note);
        m.setCreatedBy(actor);
        stockMovementRepository.save(m);
    }

    public Page<StockMovementResponse> findByBranch(Long branchId, int page, int size) {
        return stockMovementRepository.findByBranchIdOrderByCreatedAtDesc(branchId, PageRequest.of(page, size))
                .map(this::map);
    }

    private StockMovementResponse map(StockMovementEntity m) {
        return new StockMovementResponse(m.getId(), m.getProduct().getId(), m.getProduct().getName(),
                m.getBranch().getId(), m.getBranch().getName(), m.getMovementType(), m.getQuantity(),
                m.getReferenceType(), m.getReferenceId(), m.getNote(), m.getCreatedBy(), m.getCreatedAt());
    }
}
