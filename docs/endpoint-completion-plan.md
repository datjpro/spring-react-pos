# Kế hoạch hoàn thiện endpoint hệ thống POS

## Mục tiêu
- Hoàn thiện REST API theo luồng nghiệp vụ POS: xác thực, danh mục, nhập hàng, bán hàng, tồn kho, báo cáo, audit.
- Giữ API chính theo hướng `sale/purchase/stock/audit`; đánh dấu `order/payment/inventory` là legacy nếu không dùng cho frontend mới.
- Cập nhật `docs/api.md`, `docs/database.md` khi thêm/sửa endpoint hoặc entity.
- Dùng Postman collection `docs/postman/pos-system-endpoints.postman_collection.json` làm bộ test API thủ công và demo.

## Hiện trạng endpoint đã có

### Xác thực
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Sản phẩm
- `GET /api/v1/products?page&size&search&category&sort&order`
- `POST /api/v1/products`
- `GET /api/v1/products/{id}`
- `PUT /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`
- `GET /api/v1/products/categories`

### Chi nhánh
- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `PUT /api/v1/branches/{id}`
- `DELETE /api/v1/branches/{id}`

### Nhà cung cấp
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `PUT /api/v1/suppliers/{id}`
- `DELETE /api/v1/suppliers/{id}`

### Nhập hàng
- `POST /api/v1/purchases`
- `GET /api/v1/purchases`

### Bán hàng
- `POST /api/v1/sales`
- `GET /api/v1/sales`

### Điều chỉnh và truy vết kho chính
- `GET /api/v1/stock-movements`
- `POST /api/v1/stock-movements/adjustments`

### Audit
- `GET /api/v1/audit-logs`

### Báo cáo
- `GET /api/v1/reports/revenue`
- `GET /api/v1/reports/top-products`
- `GET /api/v1/reports/inventory-summary`
- `GET /api/v1/reports/export`

### Legacy endpoint đang còn trong backend
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/cancel`
- `POST /api/v1/payments`
- `GET /api/v1/payments`
- `GET /api/v1/payments/{id}`
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/low-stock`

## Endpoint cần hoàn thiện thêm

### Ưu tiên 1: Chuẩn hóa CRUD đọc chi tiết
- Thêm `GET /api/v1/branches/{id}` để xem chi tiết chi nhánh.
- Thêm `GET /api/v1/suppliers/{id}` để xem chi tiết nhà cung cấp.
- Thêm `GET /api/v1/purchases/{id}` để xem chi tiết phiếu nhập.
- Thêm `GET /api/v1/sales/{id}` để xem chi tiết hóa đơn bán.
- Thêm phân trang/lọc cho `branches`, `suppliers`, `purchases`, `sales` nếu dữ liệu lớn.

### Ưu tiên 2: Hoàn thiện trạng thái nghiệp vụ
- Thêm `POST /api/v1/purchases/{id}/cancel` nếu phiếu nhập sai.
- Thêm `POST /api/v1/sales/{id}/cancel` hoặc `POST /api/v1/sales/{id}/refund` nếu cần hoàn/hủy bán hàng.
- Chuẩn hóa trừ kho/tăng kho tự động khi tạo/hủy sale/purchase.
- Chặn thao tác khi trạng thái không hợp lệ.

### Ưu tiên 3: Quản trị người dùng và phân quyền
- Thêm `GET /api/v1/users` cho admin xem nhân viên.
- Thêm `POST /api/v1/users` cho admin tạo tài khoản.
- Thêm `PUT /api/v1/users/{id}` để sửa thông tin/role/branch.
- Thêm `PATCH /api/v1/users/{id}/active` để khóa/mở tài khoản.
- Thêm `GET /api/v1/users/me` cho người dùng hiện tại.

### Ưu tiên 4: Báo cáo phục vụ đề tài
- Thêm `GET /api/v1/reports/profit` để xem lợi nhuận theo thời gian.
- Thêm `GET /api/v1/reports/stock-card` để xem thẻ kho theo sản phẩm/chi nhánh.
- Thêm `GET /api/v1/reports/purchase-summary` để xem tổng nhập theo nhà cung cấp.
- Thêm `GET /api/v1/reports/sales-summary` để xem tổng bán theo chi nhánh/nhân viên.
- Mở rộng `reports/export` cho các loại báo cáo trên, vẫn ưu tiên `csv`.

### Ưu tiên 5: Dọn legacy
- Nếu frontend dùng luồng mới, ẩn hoặc xóa dần `orders/payments/inventory` khỏi docs chính.
- Nếu vẫn cần thanh toán riêng, chuyển `payments` sang liên kết với `sales` thay vì `orders`.
- Thống nhất một nguồn tồn kho: `stock_movements` và số tồn sản phẩm/chi nhánh.

## Kế hoạch thực hiện theo phase

### Phase 1: Tài liệu và baseline test
- Cập nhật `docs/api.md` theo endpoint thực tế.
- Import collection Postman và chạy folder `00 - Xác thực`, `01 - Sản phẩm`.
- Sửa lỗi sai schema/request nếu Postman phát hiện.
- Commit: `docs: cập nhật tài liệu endpoint hiện có và bộ test Postman`

### Phase 2: CRUD danh mục còn thiếu
- Thêm API xem chi tiết branch/supplier.
- Thêm test controller/service tương ứng.
- Cập nhật Postman folder `02 - Chi nhánh`, `03 - Nhà cung cấp`.
- Commit: `feat: hoàn thiện API chi tiết chi nhánh và nhà cung cấp`

### Phase 3: Luồng nhập hàng
- Thêm API xem chi tiết purchase.
- Thêm cancel purchase nếu yêu cầu nghiệp vụ cần.
- Kiểm tra stock movement khi nhập hàng.
- Cập nhật Postman folder `04 - Nhập hàng`.
- Commit: `feat: hoàn thiện luồng API nhập hàng và cập nhật tồn kho`

### Phase 4: Luồng bán hàng
- Thêm API xem chi tiết sale.
- Thêm cancel/refund sale nếu yêu cầu nghiệp vụ cần.
- Kiểm tra tồn kho không âm, role, chi nhánh.
- Cập nhật Postman folder `05 - Bán hàng`.
- Commit: `feat: hoàn thiện luồng API bán hàng và hủy hóa đơn`

### Phase 5: Báo cáo và xuất file
- Bổ sung báo cáo lợi nhuận, thẻ kho, tổng nhập, tổng bán nếu còn thiếu theo đề tài.
- Bổ sung export CSV cho từng loại báo cáo.
- Cập nhật Postman folder `08 - Báo cáo`.
- Commit: `feat: bổ sung API báo cáo và xuất CSV`

### Phase 6: User admin và phân quyền
- Thêm endpoint quản trị user.
- Kiểm thử ADMIN/MANAGER/STAFF theo từng nhóm quyền.
- Cập nhật Postman folder `10 - Quản trị người dùng`.
- Commit: `feat: bổ sung API quản trị người dùng và phân quyền`

### Phase 7: Dọn legacy và khóa tài liệu
- Quyết định giữ hay loại bỏ `orders/payments/inventory`.
- Nếu giữ, ghi rõ là legacy trong docs và Postman.
- Nếu bỏ, tạo migration/refactor frontend theo luồng mới.
- Commit: `refactor: chuẩn hóa luồng POS chính và tài liệu API`

## Quy ước commit tiếng Việt
- `feat: thêm API tạo phiếu nhập hàng`
- `fix: sửa lỗi tính tồn kho khi hủy hóa đơn`
- `docs: cập nhật tài liệu Postman cho API báo cáo`
- `test: bổ sung kiểm thử controller bán hàng`
- `refactor: tách logic tồn kho khỏi service bán hàng`
- `chore: cập nhật cấu hình build backend`

## Cách chạy Postman
1. Start backend tại `http://localhost:8081`.
2. Import file `docs/postman/pos-system-endpoints.postman_collection.json` vào Postman.
3. Chạy request `Đăng nhập admin` trước để tự lưu `accessToken` và `refreshToken`.
4. Chạy lần lượt các folder theo số thứ tự.
5. Với request phụ thuộc dữ liệu, chạy đúng thứ tự để tự lưu `productId`, `branchId`, `supplierId`, `purchaseId`, `saleId`, `orderId`, `paymentId`.
