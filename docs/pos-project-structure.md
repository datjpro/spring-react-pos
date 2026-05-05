# POS Inventory API Project Structure

Tài liệu này là nguồn tổng hợp chính cho cấu trúc dự án backend và docs.

## 1) Repository layout

```text
spring-react-pos/
├── backend/                 # Spring Boot API
├── frontend/                # React UI
├── docs/                    # Tài liệu dự án
├── README.md
└── AGENTS.md
```

## 2) Backend layout

Dự án dùng package theo domain để dễ mở rộng nghiệp vụ POS + tồn kho.

```text
backend/
├── pom.xml
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/
│       ├── V1__create_foundation_tables.sql
│       ├── V2__add_updated_at_to_refresh_tokens.sql
│       ├── V3__create_orders.sql                 # legacy
│       ├── V4__create_order_items.sql            # legacy
│       ├── V5__create_payments.sql               # legacy
│       ├── V6__add_payment_reference_to_payments.sql # legacy
│       └── V7__create_pos_inventory_core.sql
└── src/main/java/com/pos/
    ├── PosApplication.java
    ├── config/              # Security, JWT, CORS, OpenAPI
    ├── common/              # DTO chung, exception, enum, util, user context
    ├── auth/                # Đăng nhập, refresh token
    ├── user/                # User + role + branch scope
    ├── product/             # Sản phẩm và tồn hiện tại
    ├── branch/              # Chi nhánh/kho
    ├── supplier/            # Nhà cung cấp
    ├── purchase/            # Nhập hàng
    ├── sale/                # Bán hàng
    ├── stock/               # Stock movement + chỉnh tồn
    ├── audit/               # Audit log
    ├── report/              # Báo cáo
    ├── order/               # Legacy
    ├── payment/             # Legacy
    └── inventory/           # Legacy
```

## 3) Domain package convention

Mỗi domain nên có cấu trúc:

```text
<domain>/
├── controller/
├── dto/
├── entity/
├── repository/
└── service/
```

Quy tắc:
- Controller không chứa business logic.
- Service giữ transaction và rule nghiệp vụ.
- Repository chỉ truy vấn dữ liệu.
- Entity không trả trực tiếp ra API.
- DTO validate bằng Jakarta Bean Validation.

## 4) Core modules theo đề tài

| Module | Vai trò |
|---|---|
| `product` | Quản lý sản phẩm, giá bán, giá nhập, tồn hiện tại |
| `supplier` | Quản lý nhà cung cấp |
| `branch` | Quản lý chi nhánh/kho |
| `purchase` | Tạo phiếu nhập, cộng tồn, ghi movement IN |
| `sale` | Tạo hóa đơn bán, trừ tồn, ghi movement OUT |
| `stock` | Lịch sử kho và chỉnh tồn thủ công |
| `audit` | Ghi actor, action, entity, detail, timestamp |
| `report` | Doanh thu, giá vốn, lợi nhuận, top sản phẩm, tồn kho |

## 5) Transaction bắt buộc

| API | Transaction gồm |
|---|---|
| `POST /api/v1/sales` | Tạo sale + sale items + trừ tồn + stock movement OUT + audit log |
| `POST /api/v1/purchases` | Tạo purchase + purchase items + cộng tồn + stock movement IN + audit log |
| `POST /api/v1/stock-movements/adjustments` | Chỉnh tồn + stock movement ADJUSTMENT + audit log |

## 6) Security

- JWT bảo vệ API.
- `ADMIN`: toàn quyền.
- `MANAGER`: quản lý nghiệp vụ theo chi nhánh.
- `STAFF`: bán hàng theo chi nhánh.
- `users.branch_id`: giới hạn phạm vi dữ liệu.

## 7) Docs layout sau khi gom

```text
docs/
├── de-tai-10-pos-quan-ly-ton-kho.md  # Yêu cầu gốc
├── pos-project-structure.md          # Cấu trúc tổng hợp chính
├── architecture.md                   # Kiến trúc + luồng xử lý
├── api.md                            # Endpoint chính
├── database.md                       # Schema + quan hệ dữ liệu
└── backend-structure.md              # Cấu trúc backend hiện tại/target
```

## 8) Docs đã bỏ/gom ý
Các file dưới đây đã được gom vào các tài liệu chính để tránh trùng:
- `api-specification.md` -> `api.md`
- `backend-plan.md` -> `pos-project-structure.md` + `architecture.md`
- `product-inventory.md` -> `database.md` + `architecture.md`
- `reports.md` -> `architecture.md` + `api.md`

## 9) Test cases tối thiểu
1. Đăng nhập thành công / sai mật khẩu.
2. Bán hàng đủ tồn kho.
3. Bán hàng âm kho trả lỗi 400.
4. Nhập kho tăng tồn đúng.
5. Chỉnh tồn ghi audit log đúng actor.
6. Bán hàng đồng thời không làm âm kho.
7. User chi nhánh A không thao tác được chi nhánh B.
8. Role không đủ quyền trả 403.
