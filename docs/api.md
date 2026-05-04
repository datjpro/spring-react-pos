# API Specification

Tài liệu này liệt kê các endpoint chính của hệ thống POS backend hiện tại.

## Authentication
- `POST /api/v1/auth/login`: đăng nhập, nhận access token và refresh token.
- `POST /api/v1/auth/refresh`: cấp access token mới từ refresh token.
- `POST /api/v1/auth/logout`: đăng xuất và thu hồi refresh token.

## Products
- `GET /api/v1/products`: lấy danh sách sản phẩm, hỗ trợ phân trang/tìm kiếm/lọc.
- `POST /api/v1/products`: tạo sản phẩm mới, validate SKU unique.
- `GET /api/v1/products/{id}`: xem chi tiết sản phẩm.
- `PUT /api/v1/products/{id}`: cập nhật sản phẩm.
- `DELETE /api/v1/products/{id}`: soft delete sản phẩm.
- `GET /api/v1/products/categories`: lấy danh sách category đang hoạt động.

## Inventory
- `POST /api/v1/inventory/adjustments`: tăng/giảm tồn kho.
- `GET /api/v1/inventory/adjustments`: xem lịch sử điều chỉnh tồn kho.
- `GET /api/v1/inventory/low-stock?threshold=10`: xem sản phẩm sắp hết hàng.

## Orders
- `POST /api/v1/orders`: tạo đơn hàng từ danh sách sản phẩm và số lượng.
- `GET /api/v1/orders/{id}`: xem chi tiết đơn hàng và item snapshot.
- `GET /api/v1/orders`: phân trang/lọc đơn hàng theo status/from/to.
- `POST /api/v1/orders/{id}/cancel`: hủy đơn `PENDING` và hoàn tồn kho.

## Payments
- `POST /api/v1/payments`: thanh toán đơn hàng bằng `CASH`.
- `GET /api/v1/payments/{id}`: xem chi tiết payment.
- `GET /api/v1/payments?orderId={orderId}`: xem payment theo đơn hàng.

## Reports MVP
- `GET /api/v1/reports/revenue?from=&to=&groupBy=day`: báo cáo doanh thu từ order `COMPLETED`.
- `GET /api/v1/reports/top-products?from=&to=&limit=10&sortBy=quantity`: top sản phẩm theo snapshot `order_items`.
- `GET /api/v1/reports/inventory-summary`: tổng quan tồn kho hiện tại.
- `GET /api/v1/reports/export`: giữ contract cho phase sau, chưa implement trong Phase 2.

## Security
- `ADMIN`, `MANAGER`, `STAFF`: tạo order và thanh toán CASH.
- `ADMIN`, `MANAGER`: xem reports.
- Endpoint còn lại yêu cầu JWT, trừ login/refresh và Swagger.
