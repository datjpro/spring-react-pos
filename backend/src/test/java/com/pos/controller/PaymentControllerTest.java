package com.pos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.enums.PaymentMethod;
import com.pos.common.enums.PaymentStatus;
import com.pos.exception.GlobalExceptionHandler;
import com.pos.dto.request.CreatePaymentRequest;
import com.pos.dto.response.PaymentResponse;
import com.pos.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldCreatePaymentSuccessfully() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(1L, PaymentMethod.CASH, new BigDecimal("250000"), null, "cash");
        PaymentResponse response = buildResponse();
        when(paymentService.createPayment(any(CreatePaymentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/payments")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(1));
    }

    @Test
    void shouldFindPaymentByIdSuccessfully() throws Exception {
        when(paymentService.findPaymentById(1L)).thenReturn(buildResponse());
        mockMvc.perform(get("/api/v1/payments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value("ORD-TEST"));
    }

    @Test
    void shouldFindPaymentsByOrderIdSuccessfully() throws Exception {
        when(paymentService.findPaymentsByOrderId(1L)).thenReturn(List.of(buildResponse()));
        mockMvc.perform(get("/api/v1/payments?orderId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    private PaymentResponse buildResponse() {
        return new PaymentResponse(1L, 1L, "ORD-TEST", PaymentMethod.CASH, null, PaymentStatus.SUCCESS, new BigDecimal("200000"), new BigDecimal("250000"), new BigDecimal("50000"), "cash", Instant.now());
    }
}
