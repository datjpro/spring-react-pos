ALTER TABLE payments
    ADD COLUMN payment_reference VARCHAR(100) NULL AFTER payment_method;

CREATE INDEX idx_payments_method_status ON payments(payment_method, status);