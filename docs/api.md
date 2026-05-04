# API Specification

Tài li?u này li?t kê các endpoint chính c?a h? th?ng POS backend hi?n t?i.

## Authentication
- `POST /api/v1/auth/login`: dang nh?p, nh?n access token và refresh token.
- `POST /api/v1/auth/refresh`: c?p access token m?i t? refresh token.
- `POST /api/v1/auth/logout`: dang xu?t và thu h?i refresh token.

## Products
- `GET /api/v1/products`: l?y danh sách s?n ph?m, h? tr? phân trang/tìm ki?m/l?c.
- `POST /api/v1/products`: t?o s?n ph?m m?i, validate SKU unique.
- `GET /api/v1/products/{id}`: xem chi ti?t s?n ph?m.
- `PUT /api/v1/products/{id}`: c?p nh?t s?n ph?m.
- `DELETE /api/v1/products/{id}`: soft delete s?n ph?m.
- `GET /api/v1/products/categories`: l?y danh sách category dang ho?t d?ng.

## Inventory
- `POST /api/v1/inventory/adjustments`: tang/gi?m t?n kho.
- `GET /api/v1/inventory/adjustments`: xem l?ch s? di?u ch?nh t?n kho.
- `GET /api/v1/inventory/low-stock?threshold=10`: xem s?n ph?m s?p h?t hàng.

## Orders
- `POST /api/v1/orders`: t?o don hàng t? danh sách s?n ph?m và s? lu?ng.
- `GET /api/v1/orders/{id}`: xem chi ti?t don hàng và item snapshot.
- `GET /api/v1/orders`: phân trang/l?c don hàng theo status/from/to.
- `POST /api/v1/orders/{id}/cancel`: h?y don `PENDING` và hoàn t?n kho.

## Payments
- `POST /api/v1/payments`: thanh toán don hàng b?ng `CASH`, `CARD`, `QR`, `TRANSFER`.
- `GET /api/v1/payments/{id}`: xem chi ti?t payment.
- `GET /api/v1/payments?orderId={orderId}`: xem payment theo don hàng.
- V?i `CASH`: `amountReceived >= totalAmount`, tr? `changeAmount`.
- V?i `CARD`, `QR`, `TRANSFER`: `amountReceived = totalAmount`, h? tr? `paymentReference`.

## Reports
- `GET /api/v1/reports/revenue?from=&to=&groupBy=day|week|month`: báo cáo doanh thu t? order `COMPLETED`.
- `GET /api/v1/reports/top-products?from=&to=&limit=10&sortBy=quantity|revenue`: top s?n ph?m theo snapshot `order_items`.
- `GET /api/v1/reports/inventory-summary`: t?ng quan t?n kho hi?n t?i.
- `GET /api/v1/reports/export?type=&format=csv`: xu?t CSV cho `revenue`, `top-products`, `inventory-summary`.

## Security
- `ADMIN`, `MANAGER`, `STAFF`: t?o order và thanh toán.
- `ADMIN`, `MANAGER`: xem reports và export reports.
- Endpoint còn l?i yêu c?u JWT, tr? login/refresh và Swagger.
