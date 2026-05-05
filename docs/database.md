# Database

## Platform
- PostgreSQL
- Flyway migrations tại `backend/src/main/resources/db/migration`

## Bảng chính
- `users`
- `branches`
- `products`
- `suppliers`
- `purchases`
- `purchase_items`
- `sales`
- `sale_items`
- `stock_movements`
- `audit_logs`
- `refresh_tokens`

## Quy tắc dữ liệu
- Nhập hàng: tăng tồn + movement IN + audit trong một transaction.
- Bán hàng: giảm tồn + movement OUT + audit trong một transaction.
- Chỉnh tồn: validate reason + chống âm kho + movement ADJUSTMENT + audit.

## Legacy tables
- `orders`, `order_items`, `payments`, `inventory_adjustments`.
- Giữ tạm cho tương thích, không mở rộng thêm.
