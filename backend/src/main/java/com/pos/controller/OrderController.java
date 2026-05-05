package com.pos.controller;

import com.pos.common.enums.OrderStatus;
import com.pos.dto.request.CancelOrderRequest;
import com.pos.dto.request.CreateOrderRequest;
import com.pos.dto.response.OrderPageResponse;
import com.pos.dto.response.OrderResponse;
import com.pos.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@Deprecated
@RestController
@Validated
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest createOrderRequest,
                                                     Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(createOrderRequest, authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findOrderById(@PathVariable("id") @Min(value = 1, message = "orderId must be greater than 0") Long orderId) {
        return ResponseEntity.ok(orderService.findOrderById(orderId));
    }

    @GetMapping
    public ResponseEntity<OrderPageResponse> findOrders(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "size must be greater than or equal to 1") @Max(value = 100, message = "size must be less than or equal to 100") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(orderService.findOrders(page, size, status, from, to));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable("id") @Min(value = 1, message = "orderId must be greater than 0") Long orderId,
                                                     @Valid @RequestBody(required = false) CancelOrderRequest cancelOrderRequest) {
        CancelOrderRequest safeRequest = cancelOrderRequest == null ? new CancelOrderRequest(null) : cancelOrderRequest;
        return ResponseEntity.ok(orderService.cancelOrder(orderId, safeRequest));
    }
}
