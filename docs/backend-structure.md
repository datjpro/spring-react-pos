# Backend Structure (Current Alignment)

Backend đã được căn chỉnh theo layered monolith đúng định hướng `pos-project-structure.md`.

## Cấu trúc package hiện tại

```text
com.pos
├── PosApplication
├── config/
├── security/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
│   ├── request/
│   └── response/
├── exception/
└── common/
```

## Trạng thái nghiệp vụ

- Core module theo đề tài đã có trong layer tương ứng:
  - Product, Supplier, Branch, Purchase, Sale, StockMovement, AuditLog, Report.
- Legacy vẫn còn endpoint/controller/service/repository/entity cũ:
  - Order, Payment, InventoryAdjustment.
- Legacy chỉ để tương thích, không phải hướng phát triển tiếp.

## Quy tắc triển khai

- Controller không chứa business logic.
- Service xử lý transaction và rule nghiệp vụ.
- Repository chỉ truy cập dữ liệu.
- DTO tách request/response, không trả entity trực tiếp.
- Security tách riêng: JWT + branch access guard.
- Exception tập trung tại `com.pos.exception`.

## Kiểm chứng kỹ thuật

- Build/test backend chạy pass sau refactor package.
- Cấu trúc package không còn theo domain folder `sale/`, `purchase/`, `stock/` ở root.
