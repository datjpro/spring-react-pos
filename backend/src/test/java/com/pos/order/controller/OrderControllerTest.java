package com.pos.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.enums.OrderStatus;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.order.dto.CancelOrderRequest;
import com.pos.order.dto.CreateOrderItemRequest;
import com.pos.order.dto.CreateOrderRequest;
import com.pos.order.dto.OrderItemResponse;
import com.pos.order.dto.OrderPageResponse;
import com.pos.order.dto.OrderResponse;
import com.pos.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldCreateOrderSuccessfully() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(List.of(new CreateOrderItemRequest(1L, 2)), BigDecimal.ZERO);
        OrderResponse response = buildOrderResponse();
        when(orderService.createOrder(any(CreateOrderRequest.class), eq("admin"))).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders")
                        .principal(new UsernamePasswordAuthenticationToken("admin", null))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderCode").value("ORD-TEST"));
    }

    @Test
    void shouldFindOrderByIdSuccessfully() throws Exception {
        when(orderService.findOrderById(1L)).thenReturn(buildOrderResponse());

        mockMvc.perform(get("/api/v1/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldFindOrdersSuccessfully() throws Exception {
        OrderPageResponse pageResponse = new OrderPageResponse(List.of(buildOrderResponse()), 1, 1, 0, 20);
        when(orderService.findOrders(0, 20, null, null, null)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldCancelOrderSuccessfully() throws Exception {
        OrderResponse cancelled = new OrderResponse(1L, "ORD-TEST", "admin", OrderStatus.CANCELLED, new BigDecimal("200000"), BigDecimal.ZERO, new BigDecimal("200000"), List.of(), Instant.now());
        when(orderService.cancelOrder(eq(1L), any(CancelOrderRequest.class))).thenReturn(cancelled);

        mockMvc.perform(post("/api/v1/orders/1/cancel")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CancelOrderRequest("cancel"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    private OrderResponse buildOrderResponse() {
        OrderItemResponse itemResponse = new OrderItemResponse(1L, 1L, "Coffee", "SP-001", new BigDecimal("100000"), 2, new BigDecimal("200000"));
        return new OrderResponse(1L, "ORD-TEST", "admin", OrderStatus.PENDING, new BigDecimal("200000"), BigDecimal.ZERO, new BigDecimal("200000"), List.of(itemResponse), Instant.now());
    }
}
