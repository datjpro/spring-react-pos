# Backend Structure (Target + Current)

Tài liệu này tổng hợp từ `docs/pos-project-structure.md` và trạng thái code hiện tại.

## 1) Target structure theo đề tài

```text
backend/
├── pom.xml
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── users, branches
│       ├── products, suppliers
│       ├── purchases, purchase_items
│       ├── sales, sale_items
│       ├── stock_movements
│       └── audit_logs
└── src/main/java/com/pos/
    ├── config/
    ├── auth/
    ├── product/
    ├── supplier/
    ├── branch/
    ├── purchase/
    ├── sale/
    ├── stock/
    ├── audit/
    ├── report/
    ├── user/
    ├── common/
    └── exception/
```

## 2) Trạng thái hiện tại
Đã có đủ module lõi theo đề tài:
- `product`, `supplier`, `branch`, `purchase`, `sale`, `stock`, `audit`, `report`.
- Có `@Transactional` cho luồng nhập hàng, bán hàng, chỉnh tồn.
- Có ghi `stock_movements` và `audit_logs`.

## 3) Module legacy còn tồn tại
- `order`, `payment`, `inventory`.
- Mục đích: tương thích tạm với luồng cũ.
- Định hướng: dừng mở rộng, chuyển dần sang `sale/purchase/stock`.

## 4) Quy tắc chuẩn
- Controller: validate + auth + gọi service.
- Service: nghiệp vụ + transaction + kiểm tra quyền chi nhánh.
- Repository: truy cập JPA.
- Entity/DTO tách biệt, không trả entity trực tiếp.
- Exception tập trung qua `@ControllerAdvice`.

## 5) Việc nên làm tiếp
1. Chuẩn hóa package theo domain-first như hiện tại (giữ).
2. Giảm phụ thuộc vào module legacy.
3. Bổ sung test concurrency và branch access guard sâu hơn.
4. Chuẩn hóa report dùng dữ liệu `sales/purchases/stock_movements`.
