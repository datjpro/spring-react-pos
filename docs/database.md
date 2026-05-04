# Database Schema

Tài li?u tóm t?t schema backend POS dang qu?n lý b?ng Flyway trong `backend/src/main/resources/db/migration`.

## Foundation
- `users`: tài kho?n dang nh?p, role `ADMIN`, `MANAGER`, `STAFF`.
- `refresh_tokens`: refresh token dùng cho JWT auth.
- `products`: s?n ph?m, SKU unique, giá, t?n kho, tr?ng thái active.
- `inventory_adjustments`: l?ch s? tang/gi?m t?n kho.

## Orders
- Migration: `V3__create_orders.sql`.
- B?ng `orders` luu `order_code`, `cashier_id`, `status`, `subtotal`, `discount_amount`, `total_amount`, `created_at`, `updated_at`.
- Tr?ng thái MVP: `PENDING`, `COMPLETED`, `CANCELLED`.
- Index chính: `idx_orders_status_created(status, created_at)`.

## Order Items
- Migration: `V4__create_order_items.sql`.
- B?ng `order_items` luu snapshot t?i th?i di?m bán: `product_name`, `sku`, `unit_price`, `quantity`, `line_total`.
- Snapshot giúp reports không b? ?nh hu?ng khi tên/giá s?n ph?m hi?n t?i thay d?i.
- Index chính: `idx_order_items_product(product_id)`, `idx_order_items_order(order_id)`.

## Payments
- Migration: `V5__create_payments.sql`, `V6__add_payment_reference_to_payments.sql`.
- B?ng `payments` luu `order_id`, `payment_method`, `payment_reference`, `status`, `amount_paid`, `amount_received`, `change_amount`, `note`.
- Phase 3 m? r?ng thanh toán offline: `CASH`, `CARD`, `QR`, `TRANSFER`.
- Index chính: `idx_payments_order(order_id)`, `idx_payments_method_status(payment_method, status)`.

## Report Dependencies
- Revenue d?c `orders` có `status = COMPLETED`.
- Top-products d?c snapshot t? `order_items` và join tr?ng thái don qua `orders`.
- Inventory summary d?c tr?c ti?p t? `products`.
- Export Phase 3 t?o file CSV on-demand, không luu file trên server.
