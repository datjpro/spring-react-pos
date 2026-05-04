package com.pos.payment.service;

import com.pos.payment.dto.CreatePaymentRequest;
import com.pos.payment.dto.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest createPaymentRequest);
    PaymentResponse findPaymentById(Long paymentId);
    List<PaymentResponse> findPaymentsByOrderId(Long orderId);
}
