package com.pos.service;

import com.pos.common.enums.OrderStatus;
import com.pos.common.enums.PaymentMethod;
import com.pos.exception.BadRequestException;
import com.pos.entity.OrderEntity;
import com.pos.repository.OrderRepository;
import com.pos.dto.request.CreatePaymentRequest;
import com.pos.dto.response.PaymentResponse;
import com.pos.entity.PaymentEntity;
import com.pos.repository.PaymentRepository;
import com.pos.entity.UserEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @Test
    void shouldCreateCashPaymentSuccessfully() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");

        OrderEntity order = new OrderEntity();
        order.setId(1L);
        order.setOrderCode("ORD-TEST");
        order.setCashier(cashier);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal("200000"));

        CreatePaymentRequest request = new CreatePaymentRequest(1L, PaymentMethod.CASH, new BigDecimal("250000"), null, "cash");

        PaymentEntity payment = new PaymentEntity();
        payment.setOrder(order);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setAmountPaid(new BigDecimal("200000"));
        payment.setAmountReceived(new BigDecimal("250000"));
        payment.setChangeAmount(new BigDecimal("50000"));

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(payment);

        PaymentResponse response = paymentService.createPayment(request);

        assertEquals(new BigDecimal("50000"), response.changeAmount());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void shouldCreateCardPaymentSuccessfully() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("manager");

        OrderEntity order = new OrderEntity();
        order.setId(2L);
        order.setOrderCode("ORD-CARD");
        order.setCashier(cashier);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal("180000"));

        CreatePaymentRequest request = new CreatePaymentRequest(2L, PaymentMethod.CARD, new BigDecimal("180000"), "CARD-TXN-001", "card");

        PaymentEntity payment = new PaymentEntity();
        payment.setOrder(order);
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setPaymentReference("CARD-TXN-001");
        payment.setAmountPaid(new BigDecimal("180000"));
        payment.setAmountReceived(new BigDecimal("180000"));
        payment.setChangeAmount(BigDecimal.ZERO);

        when(orderRepository.findById(2L)).thenReturn(Optional.of(order));
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(payment);

        PaymentResponse response = paymentService.createPayment(request);

        assertEquals(BigDecimal.ZERO, response.changeAmount());
        assertEquals(PaymentMethod.CARD, response.paymentMethod());
        assertEquals("CARD-TXN-001", response.paymentReference());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    void shouldRejectPaymentWhenAmountReceivedIsLessThanTotalForCash() {
        OrderEntity order = new OrderEntity();
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal("200000"));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        CreatePaymentRequest request = new CreatePaymentRequest(1L, PaymentMethod.CASH, new BigDecimal("100000"), null, "cash");
        assertThrows(BadRequestException.class, () -> paymentService.createPayment(request));
    }

    @Test
    void shouldRejectPaymentWhenAmountReceivedIsDifferentForCard() {
        OrderEntity order = new OrderEntity();
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal("200000"));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        CreatePaymentRequest request = new CreatePaymentRequest(1L, PaymentMethod.CARD, new BigDecimal("210000"), "CARD-2", "card");
        assertThrows(BadRequestException.class, () -> paymentService.createPayment(request));
    }

    @Test
    void shouldRejectPaymentForCompletedOrder() {
        OrderEntity order = new OrderEntity();
        order.setStatus(OrderStatus.COMPLETED);
        order.setTotalAmount(new BigDecimal("200000"));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        CreatePaymentRequest request = new CreatePaymentRequest(1L, PaymentMethod.CASH, new BigDecimal("200000"), null, "cash");
        assertThrows(BadRequestException.class, () -> paymentService.createPayment(request));
    }

    @Test
    void shouldFindPaymentsByOrderIdSuccessfully() {
        UserEntity cashier = new UserEntity();
        cashier.setUsername("admin");

        OrderEntity order = new OrderEntity();
        order.setId(1L);
        order.setOrderCode("ORD-TEST");
        order.setCashier(cashier);

        PaymentEntity payment = new PaymentEntity();
        payment.setOrder(order);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setAmountPaid(new BigDecimal("200000"));
        payment.setAmountReceived(new BigDecimal("200000"));
        payment.setChangeAmount(BigDecimal.ZERO);

        when(paymentRepository.findByOrderId(1L)).thenReturn(List.of(payment));
        List<PaymentResponse> responses = paymentService.findPaymentsByOrderId(1L);

        assertEquals(1, responses.size());
    }
}
