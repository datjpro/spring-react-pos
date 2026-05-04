package com.pos.payment.service;

import com.pos.common.enums.OrderStatus;
import com.pos.common.enums.PaymentMethod;
import com.pos.common.enums.PaymentStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.order.entity.OrderEntity;
import com.pos.order.repository.OrderRepository;
import com.pos.payment.dto.CreatePaymentRequest;
import com.pos.payment.dto.PaymentResponse;
import com.pos.payment.entity.PaymentEntity;
import com.pos.payment.repository.PaymentRepository;
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
        if (createPaymentRequest.paymentMethod() != PaymentMethod.CASH) {
            throw new BadRequestException("Phase 2 supports CASH payment only");
        }

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
        if (amountReceived.compareTo(amountPaid) < 0) {
            throw new BadRequestException("amountReceived must be greater than or equal to totalAmount");
        }

        PaymentEntity paymentEntity = new PaymentEntity();
        paymentEntity.setOrder(orderEntity);
        paymentEntity.setPaymentMethod(PaymentMethod.CASH);
        paymentEntity.setStatus(PaymentStatus.SUCCESS);
        paymentEntity.setAmountPaid(amountPaid);
        paymentEntity.setAmountReceived(amountReceived);
        paymentEntity.setChangeAmount(amountReceived.subtract(amountPaid));
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

    private PaymentResponse mapToResponse(PaymentEntity paymentEntity) {
        return new PaymentResponse(
                paymentEntity.getId(),
                paymentEntity.getOrder().getId(),
                paymentEntity.getOrder().getOrderCode(),
                paymentEntity.getPaymentMethod(),
                paymentEntity.getStatus(),
                paymentEntity.getAmountPaid(),
                paymentEntity.getAmountReceived(),
                paymentEntity.getChangeAmount(),
                paymentEntity.getNote(),
                paymentEntity.getCreatedAt()
        );
    }
}
