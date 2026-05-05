package com.pos.repository;

import com.pos.entity.SupplierEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<SupplierEntity, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<SupplierEntity> findByIdAndActiveTrue(Long id);
    List<SupplierEntity> findByActiveTrueOrderByNameAsc();
}
