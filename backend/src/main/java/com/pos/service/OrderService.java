package com.pos.service;

import com.pos.common.enums.OrderStatus;
import com.pos.dto.request.CancelOrderRequest;
import com.pos.dto.request.CreateOrderRequest;
import com.pos.dto.response.OrderPageResponse;
import com.pos.dto.response.OrderResponse;

import java.time.Instant;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest createOrderRequest, String username);

    OrderResponse findOrderById(Long orderId);

    OrderPageResponse findOrders(int page, int size, OrderStatus status, Instant from, Instant to);

    OrderResponse cancelOrder(Long orderId, CancelOrderRequest cancelOrderRequest);
}
