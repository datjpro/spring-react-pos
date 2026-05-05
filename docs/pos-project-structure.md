# Cấu Trúc Project — POS & Inventory API (Spring Boot)

```text
spring-react-pos/
├── backend/
│   ├── pom.xml
│   ├── .env.example
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/
│   │       ├── V1__create_foundation_tables.sql
│   │       ├── V2__add_updated_at_to_refresh_tokens.sql
│   │       ├── V3__create_orders.sql                 # legacy
│   │       ├── V4__create_order_items.sql            # legacy
│   │       ├── V5__create_payments.sql               # legacy
│   │       ├── V6__add_payment_reference_to_payments.sql # legacy
│   │       └── V7__create_pos_inventory_core.sql
│   └── src/main/java/com/pos/
│       ├── PosApplication.java
│       ├── config/                      # Security, JWT config, OpenAPI, CORS
│       ├── security/                    # JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl, BranchAccessGuard
│       ├── controller/                  # Auth/Product/Supplier/Sale/Purchase/Stock/Branch/Report/Audit + legacy controllers
│       ├── service/                     # Business logic + transaction
│       ├── repository/                  # JPA repositories
│       ├── entity/                      # JPA entities
│       ├── dto/
│       │   ├── request/                 # request models
│       │   └── response/                # response models
│       ├── exception/                   # GlobalExceptionHandler + custom exceptions
│       └── common/                      # enums, util
├── frontend/
├── docs/
└── README.md
```

---

## Luồng xử lý chuẩn

```text
Client -> Controller -> Service (@Transactional) -> Repository -> DB
```

- Service xử lý rule nghiệp vụ: âm kho, quyền chi nhánh, audit.
- Giao dịch nhập/bán/chỉnh tồn phải ghi stock movement và audit log.

---

## Transaction bắt buộc

| API | Transaction bao gồm |
|---|---|
| `POST /api/v1/sales` | Tạo sale + sale items + trừ tồn + `StockMovement(OUT)` + `AuditLog` |
| `POST /api/v1/purchases` | Tạo purchase + purchase items + cộng tồn + `StockMovement(IN)` + `AuditLog` |
| `POST /api/v1/stock-movements/adjustments` | Cập nhật tồn + `StockMovement(ADJUSTMENT)` + `AuditLog` |

---

## Ghi chú kiến trúc

- Hướng hiện tại là **layered monolith**, không phải microservice/domain-package.
- `order/payment/inventory` vẫn tồn tại dạng legacy để tương thích, nhưng không phải hướng mở rộng chính.
