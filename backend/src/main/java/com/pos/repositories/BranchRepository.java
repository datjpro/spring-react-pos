package com.pos.repositories;

import com.pos.entities.BranchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<BranchEntity, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<BranchEntity> findByIdAndActiveTrue(Long id);
    List<BranchEntity> findByActiveTrueOrderByNameAsc();
}
