package com.pos.service;

import com.pos.common.enums.OrderStatus;
import com.pos.common.enums.Role;
import com.pos.common.exception.BadRequestException;
import com.pos.dto.request.CancelOrderRequest;
import com.pos.dto.request.CreateOrderItemRequest;
import com.pos.dto.request.CreateOrderRequest;
import com.pos.dto.response.OrderPageResponse;
import com.pos.dto.response.OrderResponse;
import com.pos.entity.OrderEntity;
import com.pos.entity.OrderItemEntity;
import com.pos.repository.OrderRepository;
import com.pos.entity.ProductEntity;
import com.pos.repository.ProductRepository;
import com.pos.entity.UserEntity;
import com.pos.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    void shouldCreateOrderSuccessfully() {
        UserEntity cashier = new UserEntity();
        cashier.setId(1L);
        cashier.setUsername("admin");
        cashier.setRole(Role.ADMIN);
        cashier.setActive(true);

        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setSku("SP-001");
        product.setName("Coffee");
        product.setPrice(new BigDecimal("100000"));
        product.setStock(10);
        product.setUnit("goi");
        product.setActive(true);

        CreateOrderRequest request = new CreateOrderRequest(List.of(new CreateOrderItemRequest(1L, 2)), BigDecimal.ZERO);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(cashier));
        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(ProductEntity.class))).thenReturn(product);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(request, "admin");

        assertEquals(OrderStatus.PENDING, response.status());
        assertEquals(new BigDecimal("200000"), response.totalAmount());
        assertEquals(8, product.getStock());
    }

    @Test
    void shouldRejectOrderWhenStockInsufficient() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");
        cashier.setRole(Role.ADMIN);
        cashier.setActive(true);

        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setSku("SP-001");
        product.setName("Coffee");
        product.setPrice(new BigDecimal("100000"));
        product.setStock(1);
        product.setActive(true);

        when(userRepository.findByUsernameAndActiveTrue("admin")).thenReturn(Optional.of(cashier));
        when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(product));

        CreateOrderRequest request = new CreateOrderRequest(List.of(new CreateOrderItemRequest(1L, 2)), BigDecimal.ZERO);
        assertThrows(BadRequestException.class, () -> orderService.createOrder(request, "admin"));
    }

    @Test
    void shouldCancelPendingOrderAndRestoreStock() {
        ProductEntity product = new ProductEntity();
        product.setId(1L);
        product.setSku("SP-001");
        product.setName("Coffee");
        product.setPrice(new BigDecimal("100000"));
        product.setStock(5);
        product.setActive(true);

        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");
        cashier.setRole(Role.ADMIN);
        cashier.setActive(true);

        OrderItemEntity item = new OrderItemEntity();
        item.setProduct(product);
        item.setProductName("Coffee");
        item.setSku("SP-001");
        item.setUnitPrice(new BigDecimal("100000"));
        item.setQuantity(2);
        item.setLineTotal(new BigDecimal("200000"));

        OrderEntity order = new OrderEntity();
        order.setId(1L);
        order.setOrderCode("ORD-TEST");
        order.setCashier(cashier);
        order.setStatus(OrderStatus.PENDING);
        order.setSubtotal(new BigDecimal("200000"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("200000"));
        order.addItem(item);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(productRepository.save(any(ProductEntity.class))).thenReturn(product);
        when(orderRepository.save(any(OrderEntity.class))).thenReturn(order);

        OrderResponse response = orderService.cancelOrder(1L, new CancelOrderRequest("cancel"));

        assertEquals(OrderStatus.CANCELLED, response.status());
        assertEquals(7, product.getStock());
    }

    @Test
    void shouldRejectCancelCompletedOrder() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");
        cashier.setRole(Role.ADMIN);
        cashier.setActive(true);

        OrderEntity order = new OrderEntity();
        order.setId(1L);
        order.setCashier(cashier);
        order.setStatus(OrderStatus.COMPLETED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        assertThrows(BadRequestException.class, () -> orderService.cancelOrder(1L, new CancelOrderRequest("cancel")));
    }

    @Test
    void shouldFindOrdersSuccessfully() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");
        cashier.setRole(Role.ADMIN);
        cashier.setActive(true);

        OrderEntity order = new OrderEntity();
        order.setId(1L);
        order.setOrderCode("ORD-TEST");
        order.setCashier(cashier);
        order.setStatus(OrderStatus.PENDING);
        order.setSubtotal(new BigDecimal("200000"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("200000"));

        Page<OrderEntity> orderPage = new PageImpl<>(List.of(order));
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(orderPage);

        OrderPageResponse response = orderService.findOrders(0, 20, null, null, null);
        assertEquals(1, response.totalElements());
    }
}
