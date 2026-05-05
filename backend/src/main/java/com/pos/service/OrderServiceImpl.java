package com.pos.service;

import com.pos.common.enums.OrderStatus;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.common.util.OrderCodeGenerator;
import com.pos.dto.request.CancelOrderRequest;
import com.pos.dto.request.CreateOrderItemRequest;
import com.pos.dto.request.CreateOrderRequest;
import com.pos.dto.response.OrderItemResponse;
import com.pos.dto.response.OrderPageResponse;
import com.pos.dto.response.OrderResponse;
import com.pos.entity.OrderEntity;
import com.pos.entity.OrderItemEntity;
import com.pos.repository.OrderRepository;
import com.pos.entity.ProductEntity;
import com.pos.repository.ProductRepository;
import com.pos.entity.UserEntity;
import com.pos.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest createOrderRequest, String username) {
        UserEntity cashier = userRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));

        BigDecimal subtotal = BigDecimal.ZERO;
        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setOrderCode(OrderCodeGenerator.generate());
        orderEntity.setCashier(cashier);
        orderEntity.setStatus(OrderStatus.PENDING);

        for (CreateOrderItemRequest itemRequest : createOrderRequest.items()) {
            ProductEntity productEntity = productRepository.findByIdAndActiveTrue(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            if (productEntity.getStock() < itemRequest.quantity()) {
                throw new BadRequestException("Insufficient stock for product " + productEntity.getSku());
            }

            productEntity.setStock(productEntity.getStock() - itemRequest.quantity());
            productRepository.save(productEntity);

            BigDecimal lineTotal = productEntity.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItemEntity orderItemEntity = new OrderItemEntity();
            orderItemEntity.setProduct(productEntity);
            orderItemEntity.setProductName(productEntity.getName());
            orderItemEntity.setSku(productEntity.getSku());
            orderItemEntity.setUnitPrice(productEntity.getPrice());
            orderItemEntity.setQuantity(itemRequest.quantity());
            orderItemEntity.setLineTotal(lineTotal);
            orderEntity.addItem(orderItemEntity);
        }

        BigDecimal discountAmount = createOrderRequest.discountAmount() == null ? BigDecimal.ZERO : createOrderRequest.discountAmount();
        if (discountAmount.compareTo(subtotal) > 0) {
            throw new BadRequestException("discountAmount must be less than or equal to subtotal");
        }

        orderEntity.setSubtotal(subtotal);
        orderEntity.setDiscountAmount(discountAmount);
        orderEntity.setTotalAmount(subtotal.subtract(discountAmount));

        return mapToResponse(orderRepository.save(orderEntity));
    }

    @Override
    public OrderResponse findOrderById(Long orderId) {
        return mapToResponse(findOrderEntityById(orderId));
    }

    @Override
    public OrderPageResponse findOrders(int page, int size, OrderStatus status, Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("from must be before or equal to to");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<OrderEntity> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<OrderEntity> orderPage = orderRepository.findAll(specification, pageable);
        List<OrderResponse> content = orderPage.getContent().stream().map(this::mapToResponse).toList();
        return new OrderPageResponse(content, orderPage.getTotalElements(), orderPage.getTotalPages(), orderPage.getNumber(), orderPage.getSize());
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, CancelOrderRequest cancelOrderRequest) {
        OrderEntity orderEntity = findOrderEntityById(orderId);
        if (orderEntity.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Completed order cannot be cancelled");
        }
        if (orderEntity.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        for (OrderItemEntity orderItem : orderEntity.getItems()) {
            ProductEntity productEntity = orderItem.getProduct();
            productEntity.setStock(productEntity.getStock() + orderItem.getQuantity());
            productRepository.save(productEntity);
        }
        orderEntity.setStatus(OrderStatus.CANCELLED);
        return mapToResponse(orderRepository.save(orderEntity));
    }

    private OrderEntity findOrderEntityById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private OrderResponse mapToResponse(OrderEntity orderEntity) {
        List<OrderItemResponse> items = orderEntity.getItems().stream()
                .map(orderItem -> new OrderItemResponse(
                        orderItem.getId(),
                        orderItem.getProduct().getId(),
                        orderItem.getProductName(),
                        orderItem.getSku(),
                        orderItem.getUnitPrice(),
                        orderItem.getQuantity(),
                        orderItem.getLineTotal()
                ))
                .toList();

        return new OrderResponse(
                orderEntity.getId(),
                orderEntity.getOrderCode(),
                orderEntity.getCashier().getUsername(),
                orderEntity.getStatus(),
                orderEntity.getSubtotal(),
                orderEntity.getDiscountAmount(),
                orderEntity.getTotalAmount(),
                items,
                orderEntity.getCreatedAt()
        );
    }
}
