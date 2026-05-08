package com.pos.services;

import com.pos.common.enums.OrderStatus;
import com.pos.dtos.request.CancelOrderRequest;
import com.pos.dtos.request.CreateOrderRequest;
import com.pos.dtos.response.OrderPageResponse;
import com.pos.dtos.response.OrderResponse;

import java.time.Instant;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest createOrderRequest, String username);

    OrderResponse findOrderById(Long orderId);

    OrderPageResponse findOrders(int page, int size, OrderStatus status, Instant from, Instant to);

    OrderResponse cancelOrder(Long orderId, CancelOrderRequest cancelOrderRequest);
}
