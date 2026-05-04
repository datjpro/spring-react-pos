package com.pos.order.service;

import com.pos.common.enums.OrderStatus;
import com.pos.order.dto.CancelOrderRequest;
import com.pos.order.dto.CreateOrderRequest;
import com.pos.order.dto.OrderPageResponse;
import com.pos.order.dto.OrderResponse;

import java.time.Instant;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest createOrderRequest, String username);

    OrderResponse findOrderById(Long orderId);
    OrderPageResponse findOrders(int page, int size, OrderStatus status, Instant from, Instant to);
    OrderResponse cancelOrder(Long orderId, CancelOrderRequest cancelOrderRequest);
}
