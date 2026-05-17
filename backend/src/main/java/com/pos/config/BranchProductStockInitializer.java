package com.pos.config;

import com.pos.entities.BranchEntity;
import com.pos.entities.ProductEntity;
import com.pos.repositories.BranchProductStockRepository;
import com.pos.repositories.BranchRepository;
import com.pos.repositories.ProductRepository;
import com.pos.services.BranchProductStockService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BranchProductStockInitializer {

    @Bean
    public ApplicationRunner branchProductStockBootstrapRunner(ProductRepository productRepository,
                                                               BranchRepository branchRepository,
                                                               BranchProductStockRepository branchProductStockRepository,
                                                               BranchProductStockService branchProductStockService) {
        return arguments -> {
            BranchEntity defaultBranch = branchRepository.findFirstByActiveTrueOrderByIdAsc()
                    .or(() -> branchRepository.findFirstByOrderByIdAsc())
                    .orElse(null);
            if (defaultBranch == null) {
                return;
            }

            for (ProductEntity product : productRepository.findAll()) {
                if (!product.isActive()) {
                    continue;
                }
                boolean exists = branchProductStockRepository
                        .findByProductIdAndBranchId(product.getId(), defaultBranch.getId())
                        .isPresent();
                if (!exists) {
                    branchProductStockService.syncTotalStockToDefaultBranch(product, product.getStock());
                }
            }
        };
    }
}
