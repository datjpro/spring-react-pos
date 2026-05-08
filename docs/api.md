# API hệ thống POS

Tài liệu mô tả các endpoint REST hiện có trong backend.

- Base URL local: `http://localhost:8081`
- Prefix API: `/api/v1`
- Auth: phần lớn endpoint cần header `Authorization: Bearer <accessToken>`.
- Quyền: backend dùng `ADMIN`, `MANAGER`, `STAFF` qua Spring Security.

## 1. Xác thực

### `POST /api/v1/auth/login`
Đăng nhập và nhận token.

Request body:
```json
{
  "username": "admin",
  "password": "123456"
}
```

Response chính:
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### `POST /api/v1/auth/refresh`
Làm mới access token.

Request body:
```json
{
  "refreshToken": "refresh-token"
}
```

### `POST /api/v1/auth/logout`
Đăng xuất tài khoản hiện tại.

Yêu cầu token hợp lệ.

## 2. Sản phẩm

### `GET /api/v1/products`
Lấy danh sách sản phẩm có phân trang, tìm kiếm, lọc và sắp xếp.

Query params:
- `page`: mặc định `0`
- `size`: mặc định `20`, tối đa `100`
- `search`: tìm theo từ khóa
- `category`: lọc theo danh mục
- `sort`: mặc định `name`
- `order`: mặc định `asc`

### `POST /api/v1/products`
Tạo sản phẩm mới.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "sku": "OW-SM-BLU-L",
  "name": "Cà phê sữa",
  "category": "Đồ uống",
  "price": 25000,
  "cost": 18000,
  "stock": 20,
  "unit": "ly",
  "barcode": "893600000001",
  "description": "Sản phẩm bán tại quầy",
  "imageUrl": "https://example.com/product.jpg"
}
```

Quy ước SKU:
- Format chung: các cụm nghiệp vụ viết hoa, ngăn cách bằng dấu `-`.
- Regex: `^[A-Z0-9]{2,6}(-[A-Z0-9]{1,8}){2,7}$`
- Mỗi ngành tự định nghĩa ý nghĩa cụm theo nhu cầu quản lý.
- Ví dụ thời trang: `OW-SM-BLU-L` = Owen, sơ mi, xanh, size L.
- Ví dụ đồ uống: `CF-LAT-HOT-M` = Coffee, latte, nóng, size M.
- Ví dụ điện tử: `SS-TV-LED-55` = Samsung, TV, LED, 55 inch.

### `GET /api/v1/products/{id}`
Lấy chi tiết sản phẩm theo ID.

### `PUT /api/v1/products/{id}`
Cập nhật sản phẩm.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "name": "Cà phê sữa cập nhật",
  "category": "Đồ uống",
  "price": 27000,
  "cost": 19000,
  "stock": 25,
  "unit": "ly",
  "barcode": "893600000001",
  "description": "Thông tin đã cập nhật",
  "imageUrl": "https://example.com/product-updated.jpg",
  "active": true
}
```

### `DELETE /api/v1/products/{id}`
Xóa sản phẩm.

Quyền: `ADMIN`, `MANAGER`.

### `GET /api/v1/products/categories`
Lấy danh sách danh mục sản phẩm hiện có.

## 3. Chi nhánh

### `GET /api/v1/branches`
Lấy danh sách chi nhánh.

### `GET /api/v1/branches/{id}`
Lấy chi tiết chi nhánh theo ID.

Response mẫu:
```json
{
  "id": 1,
  "code": "CN-01",
  "name": "Chi nhánh trung tâm",
  "address": "123 Đường A, TP.HCM",
  "active": true
}
```

### `POST /api/v1/branches`
Tạo chi nhánh.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "code": "CN-01",
  "name": "Chi nhánh trung tâm",
  "address": "123 Đường A, TP.HCM"
}
```

### `PUT /api/v1/branches/{id}`
Cập nhật chi nhánh.

Quyền: `ADMIN`, `MANAGER`.

### `DELETE /api/v1/branches/{id}`
Xóa chi nhánh.

Quyền: `ADMIN`.

## 4. Nhà cung cấp

### `GET /api/v1/suppliers`
Lấy danh sách nhà cung cấp.

### `GET /api/v1/suppliers/{id}`
Lấy chi tiết nhà cung cấp theo ID.

Response mẫu:
```json
{
  "id": 1,
  "code": "NCC-01",
  "name": "Nhà cung cấp A",
  "phone": "0901234567",
  "email": "ncc@example.com",
  "address": "456 Đường B, Hà Nội",
  "active": true
}
```

### `POST /api/v1/suppliers`
Tạo nhà cung cấp.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "code": "NCC-01",
  "name": "Nhà cung cấp A",
  "phone": "0901234567",
  "email": "ncc@example.com",
  "address": "456 Đường B, Hà Nội"
}
```

### `PUT /api/v1/suppliers/{id}`
Cập nhật nhà cung cấp.

Quyền: `ADMIN`, `MANAGER`.

### `DELETE /api/v1/suppliers/{id}`
Xóa nhà cung cấp.

Quyền: `ADMIN`.

## 5. Nhập hàng

### `POST /api/v1/purchases`
Tạo phiếu nhập hàng.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "supplierId": 1,
  "branchId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 5,
      "unitCost": 18000
    }
  ],
  "note": "Nhập hàng đầu ngày"
}
```

### `GET /api/v1/purchases`
Lấy danh sách phiếu nhập.

Quyền: `ADMIN`, `MANAGER`.

### `GET /api/v1/purchases/{id}`
Lấy chi tiết phiếu nhập theo ID.

Quyền: `ADMIN`, `MANAGER`.

### `POST /api/v1/purchases/{id}/cancel`
Hủy phiếu nhập và hoàn tác số lượng đã cộng vào tồn kho.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "reason": "Nhập sai phiếu"
}
```

Ghi chú:
- Không thể hủy phiếu đã hủy.
- Nếu việc hoàn tác làm tồn kho âm, hệ thống trả lỗi `400`.
- Khi hủy, hệ thống ghi thêm `stock_movements` và `audit_logs`.

## 6. Bán hàng

### `POST /api/v1/sales`
Tạo hóa đơn bán hàng.

Quyền: `ADMIN`, `MANAGER`, `STAFF`.

Request body:
```json
{
  "branchId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "note": "Bán tại quầy"
}
```

### `GET /api/v1/sales`
Lấy danh sách hóa đơn bán.

Quyền: `ADMIN`, `MANAGER`.

### `GET /api/v1/sales/{id}`
Lấy chi tiết hóa đơn bán theo ID.

Quyền: `ADMIN`, `MANAGER`.

### `POST /api/v1/sales/{id}/cancel`
Hủy hóa đơn bán và hoàn lại tồn kho đã trừ.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "reason": "Hủy hóa đơn nhập sai"
}
```

Ghi chú:
- Không thể hủy hóa đơn đã hủy.
- Khi hủy, hệ thống cộng lại tồn kho, ghi `stock_movements` và `audit_logs`.

## 7. Điều chỉnh và truy vết kho chính

### `GET /api/v1/stock-movements`
Lấy lịch sử biến động kho.

Quyền: `ADMIN`, `MANAGER`, `STAFF`.

Query params thường dùng:
- `productId`: lọc theo sản phẩm
- `branchId`: lọc theo chi nhánh

### `POST /api/v1/stock-movements/adjustments`
Điều chỉnh tồn kho theo luồng chính.

Quyền: `ADMIN`, `MANAGER`.

Request body:
```json
{
  "productId": 1,
  "branchId": 1,
  "quantityDelta": 3,
  "reason": "Kiểm kê tăng",
  "note": "Điều chỉnh từ kiểm kê cuối ngày"
}
```

## 8. Audit log

### `GET /api/v1/audit-logs`
Lấy nhật ký thao tác hệ thống.

Quyền: `ADMIN`, `MANAGER`.

Query params thường dùng:
- `page`: trang hiện tại
- `size`: số bản ghi mỗi trang

## 9. Báo cáo

### `GET /api/v1/reports/revenue`
Báo cáo doanh thu theo khoảng thời gian.

Quyền: `ADMIN`, `MANAGER`.

Query params:
- `from`: thời gian bắt đầu, ISO datetime, ví dụ `2026-05-01T00:00:00Z`
- `to`: thời gian kết thúc, ISO datetime
- `groupBy`: mặc định `day`
- `branchId`: tùy chọn

### `GET /api/v1/reports/top-products`
Báo cáo sản phẩm bán chạy.

Quyền: `ADMIN`, `MANAGER`.

Query params:
- `from`: thời gian bắt đầu, ISO datetime
- `to`: thời gian kết thúc, ISO datetime
- `limit`: mặc định `10`, tối đa `100`
- `sortBy`: mặc định `quantity`
- `branchId`: tùy chọn

### `GET /api/v1/reports/inventory-summary`
Báo cáo tổng quan tồn kho.

Quyền: `ADMIN`, `MANAGER`.

### `GET /api/v1/reports/export`
Xuất báo cáo dạng CSV.

Quyền: `ADMIN`, `MANAGER`.

Query params:
- `type`: loại báo cáo, ví dụ `revenue`
- `format`: hiện hỗ trợ `csv`
- `from`: tùy chọn theo loại báo cáo
- `to`: tùy chọn theo loại báo cáo
- `groupBy`: mặc định `day`
- `limit`: mặc định `10`
- `sortBy`: mặc định `quantity`
- `branchId`: tùy chọn

### `GET /api/v1/reports/profit`
Báo cáo lợi nhuận theo khoảng thời gian.

Query params:
- `from`
- `to`
- `groupBy`: `day|week|month`
- `branchId`: tùy chọn

### `GET /api/v1/reports/stock-card`
Báo cáo thẻ kho theo sản phẩm và chi nhánh.

Query params:
- `productId`: bắt buộc
- `branchId`: bắt buộc
- `from`: bắt buộc
- `to`: bắt buộc

### `GET /api/v1/reports/purchase-summary`
Báo cáo tổng hợp nhập hàng.

Query params:
- `from`
- `to`
- `supplierId`: tùy chọn
- `branchId`: tùy chọn

### `GET /api/v1/reports/sales-summary`
Báo cáo tổng hợp bán hàng.

Query params:
- `from`
- `to`
- `branchId`: tùy chọn
- `createdBy`: tùy chọn

## 10. Quản trị người dùng

### `GET /api/v1/users`
Lấy danh sách người dùng.

Quyền: `ADMIN`.

### `GET /api/v1/users/me`
Lấy hồ sơ người dùng hiện tại.

Quyền: mọi user đã đăng nhập.

### `POST /api/v1/users`
Tạo tài khoản người dùng.

Quyền: `ADMIN`.

Request body:
```json
{
  "username": "staff01",
  "password": "123456",
  "role": "STAFF",
  "branchId": 1,
  "active": true
}
```

### `PUT /api/v1/users/{id}`
Cập nhật role, chi nhánh, trạng thái người dùng.

Quyền: `ADMIN`.

### `PATCH /api/v1/users/{id}/active`
Khóa hoặc mở tài khoản người dùng.

Quyền: `ADMIN`.

Request body:
```json
{
  "active": false
}
```

## 11. Legacy endpoint

Các endpoint dưới đây đang còn trong backend nhưng không phải luồng chính theo định hướng hiện tại. Chỉ dùng khi cần kiểm thử hoặc bảo trì luồng cũ.

### Order legacy
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/cancel`

Request tạo order:
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "discountAmount": 0
}
```

Request hủy order:
```json
{
  "reason": "Khách hủy đơn"
}
```

### Payment legacy
- `POST /api/v1/payments`
- `GET /api/v1/payments?orderId={orderId}`
- `GET /api/v1/payments/{id}`

Request tạo payment:
```json
{
  "orderId": 1,
  "paymentMethod": "CASH",
  "amountReceived": 50000,
  "paymentReference": "",
  "note": "Thu tiền mặt"
}
```

`paymentMethod` thường dùng: `CASH`, `CARD`, `TRANSFER` nếu enum backend hỗ trợ.

### Inventory legacy
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/low-stock`

Request điều chỉnh inventory legacy:
```json
{
  "productId": 1,
  "adjustmentType": "INCREASE",
  "quantity": 5,
  "reason": "Bổ sung tồn kho",
  "note": "Điều chỉnh thủ công"
}
```

`adjustmentType`: `INCREASE`, `DECREASE` nếu enum backend hỗ trợ.

## 12. Bộ test Postman

File Postman collection: `docs/postman/pos-system-endpoints.postman_collection.json`.

Cách dùng:
1. Start backend tại `http://localhost:8081`.
2. Import collection vào Postman.
3. Chạy request `Đăng nhập admin` trước.
4. Chạy folder theo thứ tự từ `00` đến `09`.
5. Collection tự lưu các biến phụ thuộc như `accessToken`, `productId`, `branchId`, `supplierId`, `orderId`.

## 13. Gợi ý commit tiếng Việt

- `docs: cập nhật tài liệu API theo endpoint backend hiện tại`
- `test: bổ sung bộ Postman tiếng Việt cho endpoint hệ thống POS`
- `feat: hoàn thiện API chi tiết chi nhánh và nhà cung cấp`
- `feat: hoàn thiện luồng nhập bán và truy vết tồn kho`
