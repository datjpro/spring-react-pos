# Architecture

## Mục tiêu
Backend POS + quản lý tồn kho đa chi nhánh, bám đề tài `de-tai-10-pos-quan-ly-ton-kho.md`.

## Core domains
- `Product`
- `Supplier`
- `Branch`
- `Purchase`
- `Sale`
- `StockMovement`
- `AuditLog`

## Luồng nghiệp vụ chính

### Nhập hàng
1. Xác thực user.
2. Kiểm tra branch scope.
3. Tạo `purchase` + `purchase_items`.
4. Cộng `products.stock`.
5. Ghi `stock_movements` loại `IN`.
6. Ghi `audit_logs`.
7. Commit trong cùng transaction.

### Bán hàng
1. Xác thực user.
2. Kiểm tra branch scope.
3. Kiểm tra âm kho.
4. Tạo `sale` + `sale_items`.
5. Trừ `products.stock`.
6. Ghi `stock_movements` loại `OUT`.
7. Ghi `audit_logs`.
8. Commit trong cùng transaction.

### Chỉnh tồn
1. Nhận `productId`, `branchId`, `quantityDelta`, `reason`.
2. Chặn tồn kho âm sau chỉnh.
3. Cập nhật tồn.
4. Ghi `stock_movements(ADJUSTMENT)`.
5. Ghi `audit_logs`.
6. Commit transaction.

## Phân quyền
- `ADMIN`: toàn quyền.
- `MANAGER`, `STAFF`: bị giới hạn theo `users.branch_id`.

## Kiến trúc lớp
- Controller -> Service -> Repository -> PostgreSQL.
- DTO tách biệt entity.
- Validation bằng Bean Validation.
- Lỗi tập trung qua GlobalExceptionHandler.
