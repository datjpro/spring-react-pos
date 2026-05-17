package com.pos.repositories;

import com.pos.entities.BranchProductStockEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface BranchProductStockRepository extends JpaRepository<BranchProductStockEntity, Long>, JpaSpecificationExecutor<BranchProductStockEntity> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select branchProductStock
            from BranchProductStockEntity branchProductStock
            where branchProductStock.product.id = :productId and branchProductStock.branch.id = :branchId
            """)
    Optional<BranchProductStockEntity> findByProductIdAndBranchIdForUpdate(@Param("productId") Long productId,
                                                                           @Param("branchId") Long branchId);

    Optional<BranchProductStockEntity> findByProductIdAndBranchId(Long productId, Long branchId);

    @Query("""
            select coalesce(sum(branchProductStock.stock), 0)
            from BranchProductStockEntity branchProductStock
            where branchProductStock.product.id = :productId
            """)
    long sumStockByProductId(@Param("productId") Long productId);

    @Query(value = """
            select
                coalesce((select count(distinct bps.product_id) from branch_product_stocks bps), 0) as total_products,
                coalesce((select sum(bps.stock) from branch_product_stocks bps), 0) as total_stock,
                coalesce((
                    select count(*)
                    from (
                        select bps.product_id
                        from branch_product_stocks bps
                        group by bps.product_id
                        having sum(bps.stock) <= :threshold
                    ) low_stock_products
                ), 0) as low_stock_products,
                coalesce((
                    select count(*)
                    from (
                        select bps.product_id
                        from branch_product_stocks bps
                        group by bps.product_id
                        having sum(bps.stock) = 0
                    ) out_of_stock_products
                ), 0) as out_of_stock_products
            """, nativeQuery = true)
    Object[] summarizeInventoryByBranchStock(@Param("threshold") Integer threshold);

    Page<BranchProductStockEntity> findByBranchIdOrderByProductNameAsc(Long branchId, Pageable pageable);
}
