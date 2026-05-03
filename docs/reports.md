# Feature: Báo cáo & Thống kê

## Mục lục

- [Tổng quan](#1-tổng-quan)
- [Các loại báo cáo](#2-các-loại-báo-cáo)
- [Quy tắc nghiệp vụ](#3-quy-tắc-nghiệp-vụ)
- [Luồng xử lý](#4-luồng-xử-lý)
- [Mô hình dữ liệu](#5-mô-hình-dữ-liệu)
- [Phân quyền](#6-phân-quyền)
- [Giao diện Frontend](#7-giao-diện-frontend)
- [Hiệu năng & Caching](#8-hiệu-năng--caching)
- [Edge Cases](#9-edge-cases)

---

## 1. Tổng quan

Module **Báo cáo & Thống kê** cung cấp cái nhìn tổng quan về hoạt động kinh doanh, bao gồm:

- **Doanh thu**: tổng hợp theo ngày / tuần / tháng.
- **Sản phẩm bán chạy**: xếp hạng theo số lượng hoặc doanh thu.
- **Tổng quan kho**: giá trị tồn kho, hàng sắp hết, hết hàng.
- **Xuất báo cáo**: file Excel, CSV, PDF để lưu trữ hoặc trình bày.

Dữ liệu báo cáo chỉ dành cho **ADMIN** và **MANAGER** — không hiển thị với CASHIER.

---

## 2. Các loại báo cáo

### 2.1 Báo cáo doanh thu (`/reports/revenue`)

Thống kê tổng doanh thu và số lượng đơn hàng trong một khoảng thời gian, được nhóm theo **ngày**, **tuần**, hoặc **tháng**.

**Dữ liệu trả về:**
- Tổng doanh thu (`totalRevenue`)
- Tổng số đơn (`totalOrders`)
- Dữ liệu chi tiết theo từng period (`data[]`)

**Ví dụ use-case:**
> "Xem doanh thu tuần này so với tuần trước" → gọi 2 lần với `from/to` khác nhau, so sánh `totalRevenue`.

---

### 2.2 Sản phẩm bán chạy (`/reports/top-products`)

Xếp hạng sản phẩm theo **số lượng bán** hoặc **doanh thu** trong khoảng thời gian.

**Dữ liệu trả về:**
- Thứ hạng, tên sản phẩm, SKU
- Tổng số lượng bán (`quantitySold`)
- Tổng doanh thu (`revenue`)

**Ví dụ use-case:**
> "Top 5 sản phẩm có doanh thu cao nhất tháng này" → `limit=5&sortBy=revenue`

---

### 2.3 Tổng quan kho (`/reports/inventory-summary`)

Snapshot hiện tại của toàn bộ kho hàng.

**Dữ liệu trả về:**
- Tổng số sản phẩm đang hoạt động
- Tổng giá trị kho (`stock × cost`) theo từng danh mục
- Số sản phẩm hết hàng và sắp hết hàng

**Ví dụ use-case:**
> "Tổng giá trị hàng tồn kho hiện tại là bao nhiêu?" → gọi endpoint này, xem `totalStockValue`.

---

### 2.4 Xuất báo cáo (`/reports/export`)

Xuất dữ liệu ra file để lưu trữ hoặc chia sẻ.

| Loại báo cáo     | Format hỗ trợ       |
|------------------|---------------------|
| Doanh thu        | `xlsx`, `csv`, `pdf`|
| Sản phẩm bán chạy | `xlsx`, `csv`, `pdf`|
| Tổng quan kho    | `xlsx`, `csv`, `pdf`|

---

## 3. Quy tắc nghiệp vụ

| #  | Quy tắc |
|----|---------|
| R1 | Tham số `from` phải nhỏ hơn hoặc bằng `to`. Nếu vi phạm → trả về `400`. |
| R2 | Khoảng thời gian tối đa cho một lần query là **365 ngày**. Vượt quá → `400`. |
| R3 | Doanh thu chỉ tính các đơn hàng có trạng thái `COMPLETED`. Đơn `CANCELLED` hoặc `PENDING` không được tính. |
| R4 | `totalStockValue` = `SUM(stock × cost)` chỉ với sản phẩm `active = true`. |
| R5 | Khi `groupBy=week`, period được hiểu là **tuần bắt đầu từ thứ Hai** (ISO 8601). |
| R6 | `limit` của top-products tối đa là **100**. Vượt quá → trả về 100. |
| R7 | File export được tạo **on-demand** — không lưu trữ trên server. |

---

## 4. Luồng xử lý

### 4.1 Lấy báo cáo doanh thu

```
[MANAGER/ADMIN] Chọn khoảng thời gian + groupBy
        ↓
Validate: from <= to, khoảng <= 365 ngày
        ↓
   [Thất bại] → 400 VALIDATION_ERROR
        ↓
   [Thành công] → Query DB:
     SELECT date_trunc(groupBy, created_at), SUM(total), COUNT(*)
     FROM orders
     WHERE status = 'COMPLETED'
       AND created_at BETWEEN from AND to
     GROUP BY period
     ORDER BY period ASC
        ↓
Tính totalRevenue = SUM(revenue) của tất cả periods
Tính totalOrders = SUM(orders) của tất cả periods
        ↓
Trả về JSON response
```

### 4.2 Xuất file Excel

```
[MANAGER/ADMIN] Chọn loại báo cáo + format + khoảng thời gian
        ↓
Validate params
        ↓
Query dữ liệu (tương tự endpoint JSON tương ứng)
        ↓
Generate file:
  xlsx → Apache POI (Java)
  csv  → OpenCSV
  pdf  → JasperReports / iText
        ↓
Stream file về client với header:
  Content-Disposition: attachment; filename="report-YYYY-MM-DD.xlsx"
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

## 5. Mô hình dữ liệu

Module báo cáo **không có bảng riêng** — dữ liệu được tổng hợp từ các bảng có sẵn:

### Nguồn dữ liệu

| Báo cáo              | Bảng nguồn                             |
|----------------------|----------------------------------------|
| Doanh thu            | `orders`, `order_items`                |
| Sản phẩm bán chạy    | `order_items`, `products`              |
| Tổng quan kho        | `products`, `inventory_adjustments`    |

### Schema tham chiếu

**Bảng `orders`** _(tham chiếu từ module bán hàng)_

| Cột          | Kiểu           | Mô tả                                         |
|--------------|----------------|-----------------------------------------------|
| `id`         | `VARCHAR(36)`  | UUID, Primary Key                             |
| `status`     | `ENUM`         | `PENDING`, `COMPLETED`, `CANCELLED`           |
| `total`      | `DECIMAL(15,2)`| Tổng tiền đơn hàng                           |
| `created_at` | `TIMESTAMP`    | Thời điểm tạo đơn (dùng để nhóm theo ngày)  |

**Bảng `order_items`** _(tham chiếu từ module bán hàng)_

| Cột          | Kiểu           | Mô tả                                |
|--------------|----------------|--------------------------------------|
| `order_id`   | `VARCHAR(36)`  | FK → `orders.id`                     |
| `product_id` | `VARCHAR(36)`  | FK → `products.id`                   |
| `quantity`   | `INT`          | Số lượng                             |
| `unit_price` | `DECIMAL(15,2)`| Giá bán tại thời điểm mua            |
| `subtotal`   | `DECIMAL(15,2)`| `quantity × unit_price`              |

---

## 6. Phân quyền

| Hành động                         | `CASHIER` | `MANAGER` | `ADMIN` |
|-----------------------------------|:---------:|:---------:|:-------:|
| Xem báo cáo doanh thu             | ❌        | ✅        | ✅      |
| Xem sản phẩm bán chạy             | ❌        | ✅        | ✅      |
| Xem tổng quan kho                 | ❌        | ✅        | ✅      |
| Xuất file báo cáo                 | ❌        | ✅        | ✅      |

---

## 7. Giao diện Frontend

### Dashboard tổng quan (`/dashboard`)

Hiển thị các KPI tóm tắt cho ngày hôm nay:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Doanh thu      │  │  Số đơn hàng   │  │  Sản phẩm       │
│  hôm nay        │  │  hôm nay        │  │  sắp hết hàng   │
│  1,200,000 đ    │  │  22 đơn         │  │  8 sản phẩm     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

📈 Biểu đồ doanh thu 7 ngày gần nhất (Bar chart)

🏆 Top 5 sản phẩm bán chạy tuần này (Table)
```

### Trang báo cáo doanh thu (`/reports/revenue`)

- **Date range picker**: chọn từ ngày → đến ngày. Shortcuts: Hôm nay, 7 ngày, 30 ngày, Tháng này, Năm này.
- **Toggle groupBy**: Ngày / Tuần / Tháng.
- **Biểu đồ**: Line chart hoặc Bar chart, trục X là period, trục Y là doanh thu.
- **Bảng chi tiết**: Period | Doanh thu | Số đơn | TB/đơn
- **Nút xuất**: Export XLSX / CSV / PDF

### Trang sản phẩm bán chạy (`/reports/top-products`)

- Date range picker + limit selector (Top 5 / 10 / 20 / 50).
- Toggle sắp xếp: **Theo số lượng** / **Theo doanh thu**.
- Bảng: Hạng | Tên sản phẩm | SKU | SL bán | Doanh thu | % tổng doanh thu
- Biểu đồ: Horizontal bar chart.

### Trang tổng quan kho (`/reports/inventory`)

- Cards: Tổng giá trị kho | Số SP hết hàng | Số SP sắp hết.
- Biểu đồ tròn: phân bổ giá trị kho theo danh mục.
- Bảng hàng sắp hết: Tên SP | Tồn kho | Ngưỡng | Trạng thái

---

## 8. Hiệu năng & Caching

| Endpoint                    | Chiến lược cache                                    |
|-----------------------------|-----------------------------------------------------|
| `GET /reports/revenue`      | Cache 5 phút nếu `to` < thời điểm hiện tại 1 giờ  |
| `GET /reports/top-products` | Cache 5 phút tương tự                              |
| `GET /reports/inventory-summary` | Cache 1 phút (dữ liệu stock thay đổi thường xuyên hơn) |
| `GET /reports/export`       | Không cache — tạo file mới mỗi lần                 |

**Lưu ý:** Nếu sử dụng Redis, key cache có dạng:
```
pos:report:revenue:{from}:{to}:{groupBy}
pos:report:top-products:{from}:{to}:{limit}:{sortBy}
pos:report:inventory-summary
```

**Index DB nên có:**
```sql
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

## 9. Edge Cases

| Tình huống | Xử lý |
|---|---|
| Khoảng thời gian không có đơn nào | Trả về `data: []`, `totalRevenue: 0`, `totalOrders: 0` — không lỗi |
| `from` > `to` | Trả về `400 VALIDATION_ERROR` |
| `groupBy=month` nhưng khoảng chỉ 1 ngày | Hợp lệ — trả về 1 period duy nhất |
| Sản phẩm bị xóa (soft delete) nhưng có trong đơn cũ | Vẫn xuất hiện trong top-products với tên lúc đó |
| Giá vốn (`cost`) chưa được nhập cho sản phẩm | `totalStockValue` bỏ qua sản phẩm đó (không tính null × stock) |
| Xuất file với khoảng thời gian rất dài (365 ngày) | Giới hạn 50,000 dòng mỗi file; nếu vượt → thông báo và gợi ý chia nhỏ khoảng thời gian |
