# API Specification

> **Base URL:** `http://localhost:8080/api/v1`  
> **Auth:** Bearer Token (JWT) — include `Authorization: Bearer <token>` trong mọi request được bảo vệ.  
> **Content-Type:** `application/json`

---

## Mục lục

- [Auth](#1-auth)
- [Quản lý sản phẩm](#2-quản-lý-sản-phẩm)
- [Quản lý kho](#3-quản-lý-kho)
- [Báo cáo & Thống kê](#4-báo-cáo--thống-kê)
- [Mã lỗi chung](#5-mã-lỗi-chung)

---

## 1. Auth

### `POST /auth/login`

Đăng nhập và nhận JWT token.

**Request Body**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Response `401 Unauthorized`**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Sai tên đăng nhập hoặc mật khẩu."
}
```

---

### `POST /auth/logout`

🔒 _Yêu cầu auth_

Vô hiệu hóa token hiện tại.

**Response `200 OK`**
```json
{
  "message": "Đăng xuất thành công."
}
```

---

### `POST /auth/refresh`

Làm mới access token.

**Request Body**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "expiresIn": 3600
}
```

---

## 2. Quản lý sản phẩm

### `GET /products`

🔒 _Yêu cầu auth_

Lấy danh sách sản phẩm có hỗ trợ phân trang và tìm kiếm.

**Query Parameters**

| Tham số    | Kiểu     | Mặc định | Mô tả                                      |
|------------|----------|----------|--------------------------------------------|
| `page`     | `int`    | `0`      | Trang hiện tại (bắt đầu từ 0)             |
| `size`     | `int`    | `20`     | Số lượng item mỗi trang                   |
| `search`   | `string` | —        | Tìm kiếm theo tên hoặc mã sản phẩm (SKU) |
| `category` | `string` | —        | Lọc theo danh mục                         |
| `sort`     | `string` | `name`   | Trường sắp xếp: `name`, `price`, `stock` |
| `order`    | `string` | `asc`    | Chiều sắp xếp: `asc`, `desc`             |

**Response `200 OK`**
```json
{
  "content": [
    {
      "id": "prod-001",
      "sku": "SP-001",
      "name": "Cà phê Arabica 500g",
      "category": "Đồ uống",
      "price": 150000,
      "stock": 42,
      "unit": "gói",
      "imageUrl": "https://cdn.example.com/products/sp-001.jpg",
      "active": true,
      "createdAt": "2025-01-15T08:00:00Z"
    }
  ],
  "totalElements": 120,
  "totalPages": 6,
  "currentPage": 0,
  "pageSize": 20
}
```

---

### `POST /products`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Tạo sản phẩm mới.

**Request Body**
```json
{
  "sku": "SP-002",
  "name": "Trà ô long 200g",
  "category": "Đồ uống",
  "price": 85000,
  "cost": 50000,
  "stock": 100,
  "unit": "hộp",
  "barcode": "8936036080018",
  "description": "Trà ô long thượng hạng từ Đà Lạt.",
  "imageUrl": "https://cdn.example.com/products/sp-002.jpg"
}
```

**Validation rules:**
- `sku`: bắt buộc, duy nhất, tối đa 50 ký tự
- `name`: bắt buộc, tối đa 255 ký tự
- `price`: bắt buộc, >= 0
- `stock`: bắt buộc, >= 0

**Response `201 Created`**
```json
{
  "id": "prod-002",
  "sku": "SP-002",
  "name": "Trà ô long 200g",
  "createdAt": "2025-05-03T10:30:00Z"
}
```

---

### `GET /products/{id}`

🔒 _Yêu cầu auth_

Lấy chi tiết một sản phẩm.

**Path Parameters**

| Tham số | Kiểu     | Mô tả       |
|---------|----------|-------------|
| `id`    | `string` | ID sản phẩm |

**Response `200 OK`**
```json
{
  "id": "prod-001",
  "sku": "SP-001",
  "name": "Cà phê Arabica 500g",
  "category": "Đồ uống",
  "price": 150000,
  "cost": 90000,
  "stock": 42,
  "unit": "gói",
  "barcode": "8936036080010",
  "description": "Cà phê Arabica nguyên chất từ Buôn Ma Thuột.",
  "imageUrl": "https://cdn.example.com/products/sp-001.jpg",
  "active": true,
  "createdAt": "2025-01-15T08:00:00Z",
  "updatedAt": "2025-04-20T14:00:00Z"
}
```

**Response `404 Not Found`**
```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "Không tìm thấy sản phẩm với ID: prod-999"
}
```

---

### `PUT /products/{id}`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Cập nhật thông tin sản phẩm.

**Request Body** _(các trường không truyền sẽ giữ nguyên)_
```json
{
  "name": "Cà phê Arabica 500g (mới)",
  "price": 160000,
  "stock": 55
}
```

**Response `200 OK`**
```json
{
  "id": "prod-001",
  "name": "Cà phê Arabica 500g (mới)",
  "price": 160000,
  "stock": 55,
  "updatedAt": "2025-05-03T11:00:00Z"
}
```

---

### `DELETE /products/{id}`

🔒 _Yêu cầu auth — Role: `ADMIN`_

Xóa mềm (soft delete) sản phẩm — đặt `active = false`, không xóa khỏi DB.

**Response `204 No Content`**

---

### `GET /products/categories`

🔒 _Yêu cầu auth_

Lấy danh sách tất cả danh mục sản phẩm hiện có.

**Response `200 OK`**
```json
["Đồ uống", "Thực phẩm", "Bánh kẹo", "Gia vị"]
```

---

## 3. Quản lý kho

### `POST /inventory/adjustments`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Điều chỉnh tồn kho thủ công (nhập hàng, kiểm kê, hao hụt...).

**Request Body**
```json
{
  "productId": "prod-001",
  "type": "IMPORT",
  "quantity": 50,
  "note": "Nhập hàng từ nhà cung cấp ABC tháng 5/2025"
}
```

**Các loại `type`:**

| Giá trị    | Mô tả                                     |
|------------|-------------------------------------------|
| `IMPORT`   | Nhập hàng vào kho (tăng stock)            |
| `EXPORT`   | Xuất hàng ra (giảm stock)                 |
| `LOSS`     | Hao hụt, hỏng hóc (giảm stock)           |
| `AUDIT`    | Kiểm kê — điều chỉnh về đúng số thực tế  |

**Response `201 Created`**
```json
{
  "id": "adj-001",
  "productId": "prod-001",
  "type": "IMPORT",
  "quantityBefore": 42,
  "quantityChange": 50,
  "quantityAfter": 92,
  "note": "Nhập hàng từ nhà cung cấp ABC tháng 5/2025",
  "createdBy": "user-admin",
  "createdAt": "2025-05-03T12:00:00Z"
}
```

---

### `GET /inventory/adjustments`

🔒 _Yêu cầu auth_

Lịch sử điều chỉnh kho.

**Query Parameters**

| Tham số     | Kiểu       | Mô tả                                       |
|-------------|------------|---------------------------------------------|
| `productId` | `string`   | Lọc theo sản phẩm                           |
| `type`      | `string`   | Lọc theo loại: `IMPORT`, `EXPORT`, `LOSS`  |
| `from`      | `ISO 8601` | Từ ngày (ví dụ: `2025-05-01T00:00:00Z`)    |
| `to`        | `ISO 8601` | Đến ngày                                    |
| `page`      | `int`      | Trang (mặc định: 0)                         |
| `size`      | `int`      | Kích thước trang (mặc định: 20)             |

**Response `200 OK`**
```json
{
  "content": [
    {
      "id": "adj-001",
      "productName": "Cà phê Arabica 500g",
      "type": "IMPORT",
      "quantityChange": 50,
      "quantityAfter": 92,
      "createdBy": "admin",
      "createdAt": "2025-05-03T12:00:00Z"
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "currentPage": 0
}
```

---

### `GET /inventory/low-stock`

🔒 _Yêu cầu auth_

Lấy danh sách sản phẩm sắp hết hàng (stock < ngưỡng cảnh báo).

**Query Parameters**

| Tham số     | Kiểu  | Mặc định | Mô tả            |
|-------------|-------|----------|------------------|
| `threshold` | `int` | `10`     | Ngưỡng cảnh báo |

**Response `200 OK`**
```json
[
  {
    "id": "prod-003",
    "sku": "SP-003",
    "name": "Đường kính 1kg",
    "stock": 5,
    "unit": "túi",
    "threshold": 10
  }
]
```

---

## 4. Báo cáo & Thống kê

### `GET /reports/revenue`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Thống kê doanh thu theo khoảng thời gian và nhóm theo ngày/tuần/tháng.

**Query Parameters**

| Tham số    | Kiểu       | Bắt buộc | Mô tả                                   |
|------------|------------|----------|-----------------------------------------|
| `from`     | `ISO 8601` | ✅        | Ngày bắt đầu                           |
| `to`       | `ISO 8601` | ✅        | Ngày kết thúc                          |
| `groupBy`  | `string`   | —        | `day` (mặc định), `week`, `month`      |

**Response `200 OK`**
```json
{
  "from": "2025-05-01T00:00:00Z",
  "to": "2025-05-03T23:59:59Z",
  "groupBy": "day",
  "totalRevenue": 4500000,
  "totalOrders": 87,
  "data": [
    {
      "period": "2025-05-01",
      "revenue": 1500000,
      "orders": 30
    },
    {
      "period": "2025-05-02",
      "revenue": 1800000,
      "orders": 35
    },
    {
      "period": "2025-05-03",
      "revenue": 1200000,
      "orders": 22
    }
  ]
}
```

---

### `GET /reports/top-products`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Sản phẩm bán chạy nhất trong khoảng thời gian.

**Query Parameters**

| Tham số  | Kiểu       | Bắt buộc | Mô tả                           |
|----------|------------|----------|---------------------------------|
| `from`   | `ISO 8601` | ✅        | Ngày bắt đầu                   |
| `to`     | `ISO 8601` | ✅        | Ngày kết thúc                  |
| `limit`  | `int`      | —        | Số sản phẩm trả về (mặc định 10) |
| `sortBy` | `string`   | —        | `quantity` (mặc định), `revenue` |

**Response `200 OK`**
```json
[
  {
    "rank": 1,
    "productId": "prod-001",
    "productName": "Cà phê Arabica 500g",
    "sku": "SP-001",
    "quantitySold": 210,
    "revenue": 31500000
  },
  {
    "rank": 2,
    "productId": "prod-002",
    "productName": "Trà ô long 200g",
    "sku": "SP-002",
    "quantitySold": 145,
    "revenue": 12325000
  }
]
```

---

### `GET /reports/inventory-summary`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Tổng quan tồn kho: tổng số sản phẩm, tổng giá trị kho, sản phẩm hết hàng.

**Response `200 OK`**
```json
{
  "totalProducts": 120,
  "totalStockValue": 75000000,
  "outOfStockCount": 3,
  "lowStockCount": 8,
  "categories": [
    {
      "name": "Đồ uống",
      "productCount": 40,
      "stockValue": 30000000
    },
    {
      "name": "Thực phẩm",
      "productCount": 50,
      "stockValue": 35000000
    }
  ]
}
```

---

### `GET /reports/export`

🔒 _Yêu cầu auth — Role: `ADMIN`, `MANAGER`_

Xuất báo cáo dưới dạng file.

**Query Parameters**

| Tham số  | Kiểu       | Bắt buộc | Mô tả                                         |
|----------|------------|----------|-----------------------------------------------|
| `type`   | `string`   | ✅        | `revenue`, `top-products`, `inventory`        |
| `format` | `string`   | ✅        | `xlsx`, `csv`, `pdf`                         |
| `from`   | `ISO 8601` | —        | Từ ngày (bắt buộc với `revenue`, `top-products`) |
| `to`     | `ISO 8601` | —        | Đến ngày                                      |

**Response `200 OK`**
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx)
- Body: binary file stream

---

## 5. Mã lỗi chung

| HTTP Code | Error Code               | Mô tả                                            |
|-----------|--------------------------|--------------------------------------------------|
| `400`     | `VALIDATION_ERROR`       | Dữ liệu đầu vào không hợp lệ                    |
| `401`     | `UNAUTHORIZED`           | Chưa xác thực hoặc token hết hạn                |
| `403`     | `FORBIDDEN`              | Không có quyền thực hiện hành động này          |
| `404`     | `NOT_FOUND`              | Tài nguyên không tồn tại                        |
| `409`     | `CONFLICT`               | Dữ liệu bị trùng (ví dụ: SKU đã tồn tại)       |
| `422`     | `BUSINESS_RULE_VIOLATED` | Vi phạm nghiệp vụ (ví dụ: stock âm)            |
| `500`     | `INTERNAL_ERROR`         | Lỗi server nội bộ                               |

**Cấu trúc lỗi chuẩn:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Mô tả lỗi thân thiện với người dùng.",
  "details": {
    "field": "price",
    "issue": "Giá phải lớn hơn hoặc bằng 0."
  },
  "timestamp": "2025-05-03T10:00:00Z",
  "path": "/api/v1/products"
}
```
