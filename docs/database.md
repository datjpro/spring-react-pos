# Database Schema

Tài liệu tóm tắt schema backend POS đang quản lý bằng Flyway trong `backend/src/main/resources/db/migration`.

## Foundation
- `users`: tài khoản đăng nhập, role `ADMIN`, `MANAGER`, `STAFF`.
- `refresh_tokens`: refresh token dùng cho JWT auth.
- `products`: sản phẩm, SKU unique, giá, tồn kho, trạng thái active.
- `inventory_adjustments`: lịch sử tăng/giảm tồn kho.

## Orders
- Migration: `V3__create_orders.sql`.
- Bảng `orders` lưu `order_code`, `cashier_id`, `status`, `subtotal`, `discount_amount`, `total_amount`, `created_at`, `updated_at`.
- Trạng thái MVP: `PENDING`, `COMPLETED`, `CANCELLED`.
- Index chính: `idx_orders_status_created(status, created_at)`.

## Order Items
- Migration: `V4__create_order_items.sql`.
- Bảng `order_items` lưu snapshot tại thời điểm bán: `product_name`, `sku`, `unit_price`, `quantity`, `line_total`.
- Snapshot giúp reports không bị ảnh hưởng khi tên/giá sản phẩm hiện tại thay đổi.
- Index chính: `idx_order_items_product(product_id)`, `idx_order_items_order(order_id)`.

## Payments
- Migration: `V5__create_payments.sql`.
- Bảng `payments` lưu `order_id`, `payment_method`, `status`, `amount_paid`, `amount_received`, `change_amount`, `note`.
- Phase 2 chỉ implement `CASH`; các method khác để phase sau.
- Index chính: `idx_payments_order(order_id)`.

## Report Dependencies
- Revenue đọc `orders` có `status = COMPLETED`.
- Top-products đọc snapshot từ `order_items` và join trạng thái đơn qua `orders`.
- Inventory summary đọc trực tiếp từ `products`.
