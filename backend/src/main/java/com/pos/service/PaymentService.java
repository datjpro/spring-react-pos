package com.pos.service;

import com.pos.dto.request.CreatePaymentRequest;
import com.pos.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest createPaymentRequest);
    PaymentResponse findPaymentById(Long paymentId);
    List<PaymentResponse> findPaymentsByOrderId(Long orderId);
}
