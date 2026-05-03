# Feature: Quản lý sản phẩm & Kho hàng

## Mục lục

- [Tổng quan](#1-tổng-quan)
- [Quy tắc nghiệp vụ](#2-quy-tắc-nghiệp-vụ)
- [Luồng xử lý chính](#3-luồng-xử-lý-chính)
- [Mô hình dữ liệu](#4-mô-hình-dữ-liệu)
- [Phân quyền](#5-phân-quyền)
- [Cảnh báo & Thông báo](#6-cảnh-báo--thông-báo)
- [Giao diện Frontend](#7-giao-diện-frontend)
- [Edge Cases](#8-edge-cases)

---

## 1. Tổng quan

Module **Quản lý sản phẩm & Kho hàng** là trung tâm dữ liệu của hệ thống POS. Module này chịu trách nhiệm:

- Duy trì danh mục sản phẩm (tên, giá, SKU, barcode, danh mục).
- Theo dõi số lượng tồn kho theo thời gian thực.
- Ghi nhận mọi biến động kho (nhập, xuất, hao hụt, kiểm kê).
- Cảnh báo khi hàng sắp hết.

---

## 2. Quy tắc nghiệp vụ

### 2.1 Sản phẩm

| #  | Quy tắc |
|----|---------|
| B1 | Mỗi sản phẩm phải có **SKU duy nhất** trong toàn hệ thống. |
| B2 | **Barcode** là tùy chọn, nhưng nếu nhập thì phải duy nhất. |
| B3 | **Giá bán** (`price`) phải >= 0. **Giá vốn** (`cost`) phải >= 0. |
| B4 | Xóa sản phẩm là **soft delete** — đặt `active = false`. Không xóa khỏi DB vì có liên kết lịch sử giao dịch. |
| B5 | Sản phẩm `active = false` sẽ không hiện ở màn hình bán hàng, nhưng vẫn hiện trong báo cáo lịch sử. |
| B6 | Tên sản phẩm tối đa **255 ký tự**, SKU tối đa **50 ký tự**. |

### 2.2 Tồn kho

| #  | Quy tắc |
|----|---------|
| K1 | **Tồn kho không được âm.** Mọi thao tác giảm stock phải kiểm tra đủ hàng trước. |
| K2 | Mọi thay đổi stock đều phải được ghi vào **lịch sử điều chỉnh** (`InventoryAdjustment`) với lý do. |
| K3 | Khi có đơn hàng được tạo, stock giảm ngay (không chờ thanh toán). Nếu đơn hủy, stock được hoàn lại. |
| K4 | **Ngưỡng cảnh báo** mặc định là 10 đơn vị. Có thể cấu hình riêng cho từng sản phẩm. |
| K5 | Khi `type = AUDIT`, giá trị stock được ghi đè về đúng số kiểm kê thực tế (không cộng/trừ). |

---

## 3. Luồng xử lý chính

### 3.1 Thêm sản phẩm mới

```
[MANAGER/ADMIN] Nhập thông tin sản phẩm
        ↓
Validate (SKU unique? Barcode unique? Price >= 0?)
        ↓
   [Thất bại] → Trả về lỗi 400/409 + mô tả field lỗi
        ↓
   [Thành công] → Lưu vào DB (active = true, stock = giá trị nhập)
        ↓
Ghi 1 bản ghi InventoryAdjustment type=IMPORT cho stock ban đầu
        ↓
Trả về product object + 201 Created
```

### 3.2 Điều chỉnh kho thủ công

```
[MANAGER/ADMIN] Chọn sản phẩm + loại điều chỉnh + số lượng + ghi chú
        ↓
Validate:
  - IMPORT/EXPORT/LOSS: quantity > 0
  - AUDIT: quantity >= 0
  - EXPORT/LOSS: quantityBefore - quantity >= 0 (không âm)
        ↓
   [Thất bại] → Trả về lỗi 422 BUSINESS_RULE_VIOLATED
        ↓
   [Thành công] → Cập nhật stock trên Product
        ↓
Ghi InventoryAdjustment (productId, type, before, change, after, note, userId)
        ↓
Kiểm tra ngưỡng cảnh báo → Gửi notification nếu stock < threshold
```

### 3.3 Luồng tích hợp với đơn hàng (Order)

```
Tạo Order mới (từ module bán hàng)
        ↓
Với mỗi OrderItem:
  Kiểm tra stock >= quantity yêu cầu
        ↓
  [Không đủ hàng] → Trả về lỗi 422 + tên sản phẩm thiếu hàng
        ↓
  [Đủ hàng] → Trừ stock, ghi InventoryAdjustment type=EXPORT
        ↓
Order được tạo thành công
        ↓
[Nếu Order bị hủy] → Hoàn lại stock, ghi InventoryAdjustment type=IMPORT
```

---

## 4. Mô hình dữ liệu

### Bảng `products`

| Cột           | Kiểu           | Mô tả                             |
|---------------|----------------|-----------------------------------|
| `id`          | `VARCHAR(36)`  | UUID, Primary Key                 |
| `sku`         | `VARCHAR(50)`  | Mã sản phẩm, UNIQUE, NOT NULL     |
| `name`        | `VARCHAR(255)` | Tên sản phẩm, NOT NULL            |
| `category`    | `VARCHAR(100)` | Danh mục                         |
| `price`       | `DECIMAL(15,2)`| Giá bán, NOT NULL, >= 0          |
| `cost`        | `DECIMAL(15,2)`| Giá vốn                          |
| `stock`       | `INT`          | Tồn kho hiện tại, NOT NULL, >= 0 |
| `unit`        | `VARCHAR(50)`  | Đơn vị (cái, gói, hộp...)       |
| `barcode`     | `VARCHAR(100)` | Mã vạch, UNIQUE                  |
| `description` | `TEXT`         | Mô tả sản phẩm                   |
| `image_url`   | `VARCHAR(512)` | Link ảnh sản phẩm                |
| `threshold`   | `INT`          | Ngưỡng cảnh báo tồn kho          |
| `active`      | `BOOLEAN`      | Trạng thái hoạt động             |
| `created_at`  | `TIMESTAMP`    | Thời điểm tạo                    |
| `updated_at`  | `TIMESTAMP`    | Thời điểm cập nhật cuối          |

### Bảng `inventory_adjustments`

| Cột               | Kiểu          | Mô tả                                               |
|-------------------|---------------|-----------------------------------------------------|
| `id`              | `VARCHAR(36)` | UUID, Primary Key                                   |
| `product_id`      | `VARCHAR(36)` | FK → `products.id`                                  |
| `type`            | `ENUM`        | `IMPORT`, `EXPORT`, `LOSS`, `AUDIT`                |
| `quantity_before` | `INT`         | Tồn kho trước điều chỉnh                           |
| `quantity_change` | `INT`         | Lượng thay đổi (dương = tăng, âm = giảm)          |
| `quantity_after`  | `INT`         | Tồn kho sau điều chỉnh                             |
| `note`            | `TEXT`        | Ghi chú lý do                                       |
| `order_id`        | `VARCHAR(36)` | FK → `orders.id` (nếu điều chỉnh từ đơn hàng)     |
| `created_by`      | `VARCHAR(36)` | FK → `users.id`                                     |
| `created_at`      | `TIMESTAMP`   | Thời điểm ghi nhận                                 |

---

## 5. Phân quyền

| Hành động                         | `CASHIER` | `MANAGER` | `ADMIN` |
|-----------------------------------|:---------:|:---------:|:-------:|
| Xem danh sách sản phẩm            | ✅        | ✅        | ✅      |
| Tìm kiếm sản phẩm                 | ✅        | ✅        | ✅      |
| Xem chi tiết sản phẩm             | ✅        | ✅        | ✅      |
| Tạo / Sửa sản phẩm               | ❌        | ✅        | ✅      |
| Xóa sản phẩm (soft delete)        | ❌        | ❌        | ✅      |
| Xem lịch sử điều chỉnh kho        | ❌        | ✅        | ✅      |
| Điều chỉnh kho thủ công           | ❌        | ✅        | ✅      |
| Xem danh sách hàng sắp hết        | ❌        | ✅        | ✅      |
| Cấu hình ngưỡng cảnh báo          | ❌        | ❌        | ✅      |

---

## 6. Cảnh báo & Thông báo

| Sự kiện                          | Trigger                            | Hành động                                   |
|----------------------------------|------------------------------------|---------------------------------------------|
| Hàng sắp hết                     | `stock < threshold` sau bất kỳ giảm kho nào | Hiển thị badge "Sắp hết" trong danh sách. Ghi log cảnh báo. |
| Hết hàng                         | `stock == 0`                       | Không cho phép chọn sản phẩm ở màn hình bán hàng. Hiển thị badge "Hết hàng". |
| Điều chỉnh kho bất thường        | `LOSS` với số lượng > 20% stock hiện tại | Ghi log cảnh báo để ADMIN review.          |

---

## 7. Giao diện Frontend

### Màn hình danh sách sản phẩm (`/products`)
- Bảng dữ liệu có phân trang, tìm kiếm, lọc theo danh mục.
- Cột hiển thị: Ảnh, Tên, SKU, Danh mục, Giá, Tồn kho, Trạng thái.
- Badge màu cho stock: 🟢 Còn hàng / 🟡 Sắp hết / 🔴 Hết hàng.
- Nút: **Thêm mới**, **Sửa**, **Xóa**, **Điều chỉnh kho**.

### Màn hình thêm/sửa sản phẩm (`/products/new`, `/products/:id/edit`)
- Form với validation real-time.
- Upload ảnh sản phẩm.
- Preview barcode nếu nhập mã vạch.

### Màn hình điều chỉnh kho (Modal hoặc `/inventory/adjust`)
- Chọn loại điều chỉnh (IMPORT / EXPORT / LOSS / AUDIT).
- Nhập số lượng + ghi chú (bắt buộc cho LOSS).
- Hiển thị tồn kho trước → sau khi điều chỉnh.

### Màn hình lịch sử kho (`/inventory/history`)
- Bảng lịch sử với filter theo sản phẩm, loại, ngày.
- Hiển thị: Sản phẩm, Loại, Thay đổi (+/-), Tồn kho sau, Người thực hiện, Thời gian.

---

## 8. Edge Cases

| Tình huống | Xử lý |
|---|---|
| SKU bị trùng khi tạo | Trả về `409 CONFLICT` với thông báo rõ ràng |
| Xuất kho nhiều hơn số có | Trả về `422 BUSINESS_RULE_VIOLATED` — không cho phép stock âm |
| Sản phẩm bị xóa nhưng còn trong đơn hàng cũ | Cho phép xem lịch sử, không hiện ở màn hình bán hàng |
| Nhập stock ban đầu = 0 khi tạo sản phẩm | Hợp lệ — sản phẩm "chờ hàng về" |
| Cập nhật giá khi đã có đơn hàng chưa thanh toán | Đơn hàng giữ giá cũ tại thời điểm tạo đơn |
| Import hàng loạt từ file CSV | _(Planned)_ Validate từng dòng, rollback nếu có lỗi |
