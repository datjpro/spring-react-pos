CREATE TABLE orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_code VARCHAR(30) NOT NULL,
    cashier_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_orders_order_code UNIQUE (order_code),
    CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES users(id),
    INDEX idx_orders_status_created (status, created_at)
);

