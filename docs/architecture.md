# Kiến trúc hệ thống POS

## Mục tiêu
Backend POS phục vụ bán hàng, nhập hàng, quản lý tồn kho, báo cáo và audit. Repo hiện theo hướng monolith backend Spring Boot, frontend React, database PostgreSQL.

## Thành phần repo
- `backend/`: REST API, business logic, bảo mật, truy cập database.
- `frontend/`: giao diện quản trị và bán hàng.
- `docs/`: tài liệu API, database, kiến trúc, kế hoạch triển khai.

## Kiến trúc backend hiện tại

### Stack chính
- Java + Spring Boot.
- Spring Web cho REST API.
- Spring Security + JWT cho xác thực.
- Spring Data JPA cho truy cập dữ liệu.
- Flyway cho migration database.
- PostgreSQL cho lưu trữ.

### Cấu trúc lớp
- `controllers`: nhận HTTP request, validate input mức API, trả DTO response.
- `services`: chứa nghiệp vụ chính.
- `repositories`: truy cập database qua JPA.
- `entities`: ánh xạ bảng database.
- `dtos/request`, `dtos/response`: tách request/response khỏi entity.
- `common/exception`: lỗi nghiệp vụ và global exception handler.
- `security`: JWT filter, user details service, branch access guard.
- `config`: security, bootstrap admin, web config, OpenAPI config.

Luồng gọi chuẩn:
- `Controller -> Service -> Repository -> PostgreSQL`.

## Xác thực và phân quyền

### JWT stateless
- `POST /api/v1/auth/login` cấp `accessToken` và `refreshToken`.
- `POST /api/v1/auth/refresh` cấp access token mới.
- `POST /api/v1/auth/logout` thu hồi phiên phía hệ thống.
- `SecurityConfig` chạy stateless, tắt session server-side.
- `JwtAuthenticationFilter` chặn request và nạp user vào security context.

### Quyền hệ thống
- `ADMIN`: toàn quyền, không bị khóa theo chi nhánh.
- `MANAGER`: quyền quản lý trong phạm vi chi nhánh được gán.
- `STAFF`: quyền thao tác bán hàng và xem dữ liệu theo scope cho phép.

### Chặn theo chi nhánh
- `BranchAccessGuard` kiểm tra `branchId` ở nghiệp vụ có scope chi nhánh.
- `ADMIN` bỏ qua check này.
- `MANAGER` và `STAFF` phải khớp `users.branch_id`.

## Domain chính
- `Auth`: đăng nhập, refresh token, logout.
- `Product`: danh mục hàng hóa.
- `Branch`: chi nhánh/cửa hàng.
- `Supplier`: nhà cung cấp.
- `Purchase`: nhập hàng.
- `Sale`: bán hàng.
- `StockMovement`: lịch sử biến động kho theo sản phẩm và chi nhánh.
- `AuditLog`: nhật ký thao tác.

## Luồng nghiệp vụ chính

### 1. Quản lý sản phẩm
1. User có quyền tạo hoặc sửa sản phẩm.
2. Controller nhận request và validate DTO.
3. Service kiểm tra SKU trùng, dữ liệu giá, tồn, trạng thái.
4. Repository lưu `products`.
5. Response trả `ProductResponse` thay vì entity.

### 2. Nhập hàng
1. User gọi `POST /api/v1/purchases`.
2. Service kiểm tra quyền và branch scope.
3. Service tải `supplier`, `branch`, `product` liên quan.
4. Tạo `purchases` và `purchase_items`.
5. Cộng `products.stock`.
6. Ghi `stock_movements` loại nhập với `reference_type = PURCHASE`.
7. Ghi `audit_logs`.
8. Commit trong cùng transaction.

### 3a. Hủy hóa đơn bán
1. User gọi `POST /api/v1/sales/{id}/cancel`.
2. Service kiểm tra quyền và branch scope.
3. Kiểm tra hóa đơn chưa bị hủy.
4. Cộng lại số lượng đã bán vào tồn kho.
5. Ghi `stock_movements` loại hoàn tác bán.
6. Ghi `audit_logs`.
7. Commit trong cùng transaction.

### 2a. Hủy phiếu nhập
1. User gọi `POST /api/v1/purchases/{id}/cancel`.
2. Service kiểm tra quyền và branch scope.
3. Kiểm tra phiếu chưa bị hủy.
4. Trừ lại số lượng đã nhập khỏi tồn kho.
5. Ghi `stock_movements` loại hoàn tác nhập.
6. Ghi `audit_logs`.
7. Commit trong cùng transaction.

### 3. Bán hàng
1. User gọi `POST /api/v1/sales`.
2. Service kiểm tra quyền và branch scope.
3. Service kiểm tra sản phẩm tồn tại và không âm kho.
4. Tạo `sales` và `sale_items`.
5. Trừ `products.stock`.
6. Ghi `stock_movements` loại xuất với `reference_type = SALE`.
7. Ghi `audit_logs`.
8. Commit trong cùng transaction.

### 4. Điều chỉnh tồn kho chính
1. User gọi `POST /api/v1/stock-movements/adjustments`.
2. Service nhận `productId`, `branchId`, `quantityDelta`, `reason`, `note`.
3. Kiểm tra quyền và branch scope.
4. Tính tồn sau điều chỉnh, chặn âm kho.
5. Cập nhật `products.stock`.
6. Ghi `stock_movements` loại điều chỉnh.
7. Ghi `audit_logs`.
8. Commit trong cùng transaction.

### 5. Báo cáo
1. User gọi nhóm `GET /api/v1/reports/*`.
2. Service tổng hợp dữ liệu từ `sales`, `sale_items`, `products`, `stock_movements`.
3. Trả DTO báo cáo JSON hoặc CSV export.
4. Quyền truy cập: `ADMIN`, `MANAGER`.

## Endpoint chính và endpoint legacy

### Luồng chính nên dùng
- `auth`
- `products`
- `branches`
- `suppliers`
- `purchases`
- `sales`
- `stock-movements`
- `audit-logs`
- `reports`

### Luồng legacy còn tồn tại
- `orders`
- `payments`
- `inventory`

Ghi chú:
- `orders`, `payments`, `inventory_adjustments` đang được đánh dấu legacy ở tài liệu.
- Không nên mở rộng nghiệp vụ mới trên luồng này nếu frontend chuyển sang `sales/purchases/stock-movements`.

## Xử lý lỗi và phản hồi API
- Validation dùng Bean Validation trên DTO.
- Lỗi tập trung qua `GlobalExceptionHandler`.
- Lỗi bảo mật trả JSON qua `SecurityConfig`.
- DTO dùng kiểu response riêng thay vì trả entity trực tiếp.

## Dữ liệu khởi tạo
- `AdminDataInitializer` có thể tự tạo tài khoản admin lúc khởi động.
- Cấu hình tại `app.bootstrap.admin.*` trong file cấu hình backend.
- Luồng test hiện dùng mặc định tài khoản `admin / 123456` theo tài liệu và script test repo.

## CORS và môi trường local
- CORS hiện cho phép `http://localhost:3000` và `http://127.0.0.1:3000`.
- Backend local base URL đang dùng trong docs/test: `http://localhost:8081`.
- Swagger/OpenAPI path được mở quyền tại `/swagger-ui/**` và `/v3/api-docs/**`.

## Điểm cần lưu ý kiến trúc hiện tại
- `products.stock` đang là tồn kho tổng, trong khi `stock_movements` có `branch_id`.
- Điều này đủ cho demo và phase hiện tại, nhưng chưa là mô hình tồn kho đa chi nhánh hoàn chỉnh.
- Nếu mở rộng thật, nên thêm bảng tồn kho theo chi nhánh và sửa service nhập, bán, điều chỉnh kho theo bảng đó.

## Hướng hoàn thiện tiếp
- Bổ sung `GET by id` cho `branches`, `suppliers`, `purchases`, `sales`.
- Bổ sung quản trị `users` và API hồ sơ người dùng hiện tại.
- Bổ sung báo cáo lợi nhuận, tổng nhập, tổng bán, thẻ kho.
- Quyết định dọn hoặc refactor hẳn luồng legacy `orders/payments/inventory`.
- Chuẩn hóa tồn kho đa chi nhánh nếu bài toán cần vận hành thật.
