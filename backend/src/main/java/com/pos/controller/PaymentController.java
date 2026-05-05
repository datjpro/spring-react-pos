package com.pos.controller;

import com.pos.dto.request.CreatePaymentRequest;
import com.pos.dto.response.PaymentResponse;
import com.pos.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Deprecated
@RestController
@Validated
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest createPaymentRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(createPaymentRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> findPaymentById(@PathVariable("id") @Min(value = 1, message = "paymentId must be greater than 0") Long paymentId) {
        return ResponseEntity.ok(paymentService.findPaymentById(paymentId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> findPaymentsByOrderId(@RequestParam("orderId") @Min(value = 1, message = "orderId must be greater than 0") Long orderId) {
        return ResponseEntity.ok(paymentService.findPaymentsByOrderId(orderId));
    }
}
