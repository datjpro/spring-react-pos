package com.pos.repositories;

import com.pos.common.enums.OrderStatus;
import com.pos.entities.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long>, JpaSpecificationExecutor<OrderEntity> {

    Optional<OrderEntity> findByOrderCode(String orderCode);

    @Query("""
            select function('date', orderEntity.createdAt), coalesce(sum(orderEntity.totalAmount), 0), count(orderEntity.id)
            from OrderEntity orderEntity
            where orderEntity.status = :status
              and orderEntity.createdAt >= :from
              and orderEntity.createdAt <= :to
            group by function('date', orderEntity.createdAt)
            order by function('date', orderEntity.createdAt)
            """)
    List<Object[]> summarizeRevenueByDate(@Param("status") OrderStatus status,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to);
}
