package com.pos.repositories;

import com.pos.common.enums.OrderStatus;
import com.pos.entities.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    @Query("""
            select orderItem.product.id, orderItem.sku, orderItem.productName,
                   sum(orderItem.quantity), coalesce(sum(orderItem.lineTotal), 0)
            from OrderItemEntity orderItem
            where orderItem.order.status = :status
              and orderItem.order.createdAt >= :from
              and orderItem.order.createdAt <= :to
            group by orderItem.product.id, orderItem.sku, orderItem.productName
            """)
    List<Object[]> summarizeTopProducts(@Param("status") OrderStatus status,
                                         @Param("from") Instant from,
                                         @Param("to") Instant to);
}
