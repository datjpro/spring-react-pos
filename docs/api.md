# API Specification

Tài liệu này liệt kê các endpoint chính của hệ thống POS.

## 1. Authentication
- `POST /api/auth/login`: Đăng nhập hệ thống.
- `POST /api/auth/logout`: Đăng xuất.

## 2. Products
- `GET /api/products`: Lấy danh sách sản phẩm.
- `GET /api/products/{id}`: Chi tiết sản phẩm.
- `POST /api/products`: Thêm sản phẩm mới.

## 3. Orders
- `POST /api/orders`: Tạo đơn hàng mới.
- `GET /api/orders/{id}`: Xem chi tiết đơn hàng.
