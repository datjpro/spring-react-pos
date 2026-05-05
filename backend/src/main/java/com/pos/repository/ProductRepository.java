package com.pos.repository;

import com.pos.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<ProductEntity, Long>, JpaSpecificationExecutor<ProductEntity> {

    boolean existsBySkuIgnoreCase(String sku);

    Optional<ProductEntity> findByIdAndActiveTrue(Long id);

    List<ProductEntity> findByActiveTrueAndStockLessThanEqualOrderByStockAsc(Integer threshold);

    @Query("select distinct product.category from ProductEntity product where product.active = true and product.category is not null order by product.category")
    List<String> findDistinctActiveCategories();

    @Query("select count(product.id), coalesce(sum(product.stock), 0) from ProductEntity product")
    Object[] summarizeInventoryTotals();

    long countByActiveTrue();

    long countByActiveTrueAndStockLessThanEqual(Integer threshold);

    long countByActiveTrueAndStock(Integer stock);
}
