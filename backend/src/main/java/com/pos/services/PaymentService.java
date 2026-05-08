package com.pos.services;

import com.pos.dtos.request.CreatePaymentRequest;
import com.pos.dtos.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest createPaymentRequest);

    PaymentResponse findPaymentById(Long paymentId);

    List<PaymentResponse> findPaymentsByOrderId(Long orderId);
}
