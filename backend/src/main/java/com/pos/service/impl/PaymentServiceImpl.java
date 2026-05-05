package com.pos.service.impl;

import com.pos.service.*;

import com.pos.common.enums.OrderStatus;
import com.pos.common.enums.PaymentMethod;
import com.pos.common.enums.PaymentStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.entity.OrderEntity;
import com.pos.repository.OrderRepository;
import com.pos.dto.request.CreatePaymentRequest;
import com.pos.dto.response.PaymentResponse;
import com.pos.entity.PaymentEntity;
import com.pos.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest createPaymentRequest) {
        OrderEntity orderEntity = orderRepository.findById(createPaymentRequest.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (orderEntity.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Order is already completed");
        }
        if (orderEntity.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cancelled order cannot be paid");
        }

        BigDecimal amountPaid = orderEntity.getTotalAmount();
        BigDecimal amountReceived = createPaymentRequest.amountReceived();
        BigDecimal changeAmount = calculateChangeAmount(createPaymentRequest.paymentMethod(), amountPaid,
                amountReceived);

        PaymentEntity paymentEntity = new PaymentEntity();
        paymentEntity.setOrder(orderEntity);
        paymentEntity.setPaymentMethod(createPaymentRequest.paymentMethod());
        paymentEntity.setPaymentReference(normalizeReference(createPaymentRequest.paymentReference()));
        paymentEntity.setStatus(PaymentStatus.SUCCESS);
        paymentEntity.setAmountPaid(amountPaid);
        paymentEntity.setAmountReceived(amountReceived);
        paymentEntity.setChangeAmount(changeAmount);
        paymentEntity.setNote(createPaymentRequest.note());

        PaymentEntity savedPayment = paymentRepository.save(paymentEntity);

        orderEntity.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(orderEntity);

        return mapToResponse(savedPayment);
    }

    @Override
    public PaymentResponse findPaymentById(Long paymentId) {
        PaymentEntity paymentEntity = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return mapToResponse(paymentEntity);
    }

    @Override
    public List<PaymentResponse> findPaymentsByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BigDecimal calculateChangeAmount(PaymentMethod paymentMethod, BigDecimal amountPaid,
            BigDecimal amountReceived) {
        if (paymentMethod == PaymentMethod.CASH) {
            if (amountReceived.compareTo(amountPaid) < 0) {
                throw new BadRequestException("amountReceived must be greater than or equal to totalAmount");
            }
            return amountReceived.subtract(amountPaid);
        }

        if (paymentMethod == PaymentMethod.CARD
                || paymentMethod == PaymentMethod.QR
                || paymentMethod == PaymentMethod.TRANSFER) {
            if (amountReceived.compareTo(amountPaid) != 0) {
                throw new BadRequestException("amountReceived must equal totalAmount for non-cash payment");
            }
            return BigDecimal.ZERO;
        }

        throw new BadRequestException("Unsupported payment method");
    }

    private String normalizeReference(String paymentReference) {
        if (paymentReference == null) {
            return null;
        }
        String trimmedReference = paymentReference.trim();
        return trimmedReference.isEmpty() ? null : trimmedReference;
    }

    private PaymentResponse mapToResponse(PaymentEntity paymentEntity) {
        return new PaymentResponse(
                paymentEntity.getId(),
                paymentEntity.getOrder().getId(),
                paymentEntity.getOrder().getOrderCode(),
                paymentEntity.getPaymentMethod(),
                paymentEntity.getPaymentReference(),
                paymentEntity.getStatus(),
                paymentEntity.getAmountPaid(),
                paymentEntity.getAmountReceived(),
                paymentEntity.getChangeAmount(),
                paymentEntity.getNote(),
                paymentEntity.getCreatedAt());
    }
}
