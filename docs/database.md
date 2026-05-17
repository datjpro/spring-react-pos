# Database hệ thống POS

## Nền tảng
- Database: PostgreSQL.
- Migration: Flyway tại `backend/src/main/resources/db/migration`.
- JPA entity: `backend/src/main/java/com/pos/entities`.
- Base entity dùng `id`, `created_at`, `updated_at` tùy loại entity.

## Migration hiện có
- `V1__create_foundation_tables.sql`: tạo nền tảng `branches`, `users`, `refresh_tokens`, `products`.
- `V2__add_updated_at_to_refresh_tokens.sql`: thêm `updated_at` cho `refresh_tokens`.
- `V3` đến `V6`: migration cũ còn trong lịch sử Flyway để tương thích database đã tạo trước đó.
- `V7__create_pos_inventory_core.sql`: tạo bảng nghiệp vụ chính `suppliers`, `purchases`, `purchase_items`, `sales`, `sale_items`, `stock_movements`, `audit_logs`.
- `V8__add_performance_indexes.sql`: bổ sung index tối ưu truy vấn danh sách, báo cáo và lịch sử kho.

## Bảng chính

### `branches`
Lưu chi nhánh/cửa hàng.

Cột chính:
- `id`: khóa chính.
- `code`: mã chi nhánh, unique.
- `name`: tên chi nhánh.
- `address`: địa chỉ.
- `active`: trạng thái hoạt động.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Quan hệ:
- Một chi nhánh có nhiều `users`.
- Một chi nhánh có nhiều `purchases`.
- Một chi nhánh có nhiều `sales`.
- Một chi nhánh có nhiều `stock_movements`.

### `users`
Lưu tài khoản đăng nhập và phân quyền.

Cột chính:
- `id`: khóa chính.
- `username`: tên đăng nhập, unique.
- `password`: mật khẩu đã mã hóa BCrypt.
- `role`: quyền người dùng, gồm `ADMIN`, `MANAGER`, `STAFF`.
- `branch_id`: chi nhánh phụ trách, nullable cho admin.
- `active`: trạng thái tài khoản.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Quan hệ:
- `users.branch_id` tham chiếu `branches.id`.
- `users` phát sinh `refresh_tokens`.

### `refresh_tokens`
Lưu refresh token phục vụ xác thực JWT.

Cột chính:
- `id`: khóa chính.
- `token`: refresh token, unique.
- `user_id`: user sở hữu token.
- `expiry_at`: thời điểm hết hạn.
- `revoked`: trạng thái thu hồi.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Quan hệ:
- `refresh_tokens.user_id` tham chiếu `users.id`.

### `products`
Lưu danh mục hàng hóa.

Cột chính:
- `id`: khóa chính.
- `sku`: mã sản phẩm, unique.
- `name`: tên sản phẩm.
- `category`: danh mục.
- `price`: giá bán.
- `cost`: giá vốn.
- `stock`: tồn kho tổng hiện tại.
- `unit`: đơn vị tính.
- `barcode`: mã vạch.
- `description`: mô tả.
- `image_url`: ảnh sản phẩm.
- `active`: trạng thái sản phẩm.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Index:
- `idx_products_name` trên `name`.
- `idx_products_category` trên `category`.

Lưu ý:
- Hiện `products.stock` là số tồn tổng dùng trong service.
- Nếu cần tồn theo chi nhánh thật, nên bổ sung bảng `branch_product_stocks` ở phase sau.

### `suppliers`
Lưu nhà cung cấp.

Cột chính:
- `id`: khóa chính.
- `code`: mã nhà cung cấp, unique.
- `name`: tên nhà cung cấp.
- `phone`: số điện thoại.
- `email`: email.
- `address`: địa chỉ.
- `active`: trạng thái hoạt động.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Quan hệ:
- Một nhà cung cấp có nhiều `purchases`.

### `purchases`
Lưu phiếu nhập hàng.

Cột chính:
- `id`: khóa chính.
- `purchase_code`: mã phiếu nhập, unique.
- `supplier_id`: nhà cung cấp.
- `branch_id`: chi nhánh nhập hàng.
- `status`: trạng thái phiếu nhập.
- `total_amount`: tổng tiền nhập.
- `created_by`: username người tạo.
- `created_at`: thời gian tạo.

Quan hệ:
- `purchases.supplier_id` tham chiếu `suppliers.id`.
- `purchases.branch_id` tham chiếu `branches.id`.
- Một `purchase` có nhiều `purchase_items`.
- Tạo `purchase` sinh `stock_movements` loại nhập.
- Hủy `purchase` chuyển trạng thái `CANCELLED`, trừ lại tồn kho và sinh `stock_movements` hoàn tác.

### `purchase_items`
Lưu dòng sản phẩm trong phiếu nhập.

Cột chính:
- `id`: khóa chính.
- `purchase_id`: phiếu nhập.
- `product_id`: sản phẩm.
- `unit_cost`: giá nhập mỗi đơn vị.
- `quantity`: số lượng nhập.
- `line_total`: thành tiền dòng.

Quan hệ:
- `purchase_items.purchase_id` tham chiếu `purchases.id`.
- `purchase_items.product_id` tham chiếu `products.id`.

### `sales`
Lưu hóa đơn bán hàng.

Cột chính:
- `id`: khóa chính.
- `sale_code`: mã hóa đơn, unique.
- `branch_id`: chi nhánh bán.
- `status`: trạng thái hóa đơn.
- `total_amount`: tổng tiền bán.
- `created_by`: username người tạo.
- `created_at`: thời gian tạo.

Quan hệ:
- `sales.branch_id` tham chiếu `branches.id`.
- Một `sale` có nhiều `sale_items`.
- Tạo `sale` sinh `stock_movements` loại xuất.
- Hủy `sale` chuyển trạng thái `CANCELLED`, cộng lại tồn kho và sinh `stock_movements` hoàn tác.

### `sale_items`
Lưu dòng sản phẩm trong hóa đơn bán.

Cột chính:
- `id`: khóa chính.
- `sale_id`: hóa đơn bán.
- `product_id`: sản phẩm.
- `unit_price`: giá bán mỗi đơn vị.
- `quantity`: số lượng bán.
- `line_total`: thành tiền dòng.

Quan hệ:
- `sale_items.sale_id` tham chiếu `sales.id`.
- `sale_items.product_id` tham chiếu `products.id`.

### `stock_movements`
Lưu lịch sử biến động tồn kho theo sản phẩm và chi nhánh.

Cột chính:
- `id`: khóa chính.
- `product_id`: sản phẩm.
- `branch_id`: chi nhánh.
- `movement_type`: loại biến động kho.
- `quantity`: số lượng biến động.
- `reference_type`: nguồn phát sinh, ví dụ `PURCHASE`, `SALE`, `ADJUSTMENT`.
- `reference_id`: ID bản ghi nguồn.
- `note`: ghi chú.
- `created_by`: username người tạo.
- `created_at`: thời gian tạo.

Index:
- `idx_stock_movements_branch_created` trên `branch_id`, `created_at`.
- `idx_stock_movements_product_created` trên `product_id`, `created_at`.

### `branch_product_stocks`
Lưu tồn kho thực tế theo từng sản phẩm và từng chi nhánh.

Cột chính:
- `id`: khóa chính.
- `product_id`: sản phẩm.
- `branch_id`: chi nhánh.
- `stock`: tồn hiện tại tại chi nhánh.
- `created_at`, `updated_at`: thời gian tạo/cập nhật.

Quan hệ:
- Unique `(product_id, branch_id)` để mỗi sản phẩm chỉ có một dòng tồn cho mỗi chi nhánh.
- Luồng `purchases`, `sales`, `stock_movements/adjustments` cập nhật bảng này trước.
- `products.stock` vẫn được giữ làm tồn tổng toàn hệ thống để tương thích API cũ.

### `audit_logs`
Lưu nhật ký thao tác nghiệp vụ.

Cột chính:
- `id`: khóa chính.
- `actor`: username thực hiện.
- `action`: hành động.
- `entity_name`: tên entity tác động.
- `entity_id`: ID entity tác động.
- `details`: chi tiết dạng text.
- `created_at`: thời gian tạo.

Index:
- `idx_audit_logs_created` trên `created_at`.

## Luồng dữ liệu nghiệp vụ

### Nhập hàng
1. User gửi `POST /api/v1/purchases`.
2. Service kiểm tra user, chi nhánh, nhà cung cấp, sản phẩm.
3. Tạo `purchases` và `purchase_items`.
4. Cộng `branch_product_stocks.stock` của đúng chi nhánh, rồi đồng bộ `products.stock`.
5. Ghi `stock_movements` với `reference_type = PURCHASE`.
6. Ghi `audit_logs`.
7. Commit cùng transaction.

### Bán hàng
1. User gửi `POST /api/v1/sales`.
2. Service kiểm tra user, chi nhánh, sản phẩm và tồn kho.
3. Tạo `sales` và `sale_items`.
4. Trừ `branch_product_stocks.stock` của đúng chi nhánh, rồi đồng bộ `products.stock`.
5. Ghi `stock_movements` với `reference_type = SALE`.
6. Ghi `audit_logs`.
7. Commit cùng transaction.

### Điều chỉnh tồn kho chính
1. User gửi `POST /api/v1/stock-movements/adjustments`.
2. Service kiểm tra sản phẩm, chi nhánh, số lượng và lý do.
3. Cập nhật `branch_product_stocks.stock` của chi nhánh yêu cầu, rồi đồng bộ `products.stock`.
4. Ghi `stock_movements` với `reference_type = ADJUSTMENT`.
5. Ghi `audit_logs`.
6. Commit cùng transaction.

## Ghi chú phát triển tiếp
- Nếu yêu cầu tồn kho đa chi nhánh chuẩn, bổ sung bảng `branch_product_stocks(product_id, branch_id, stock)` và đồng bộ với `stock_movements`.
- Tồn kho đa chi nhánh hiện được quản lý qua `branch_product_stocks`; `products.stock` chỉ là tồn tổng để giữ tương thích.
- Nếu cần thanh toán chi tiết cho hóa đơn bán, thêm bảng `sale_payments` trỏ trực tiếp sang `sales`.
- Không dùng lại luồng bán hàng cũ trong migration lịch sử cho nghiệp vụ chính của đồ án.

## Index tối ưu bổ sung

Migration `V8__add_performance_indexes.sql` thêm các index sau:
- `idx_sales_status_branch_created` trên `sales(status, branch_id, created_at)`.
- `idx_sales_status_creator_created` trên `sales(status, created_by, created_at)`.
- `idx_purchases_status_branch_created` trên `purchases(status, branch_id, created_at)`.
- `idx_purchases_status_supplier_created` trên `purchases(status, supplier_id, created_at)`.
- `idx_sale_items_sale` trên `sale_items(sale_id)`.
- `idx_sale_items_product` trên `sale_items(product_id)`.
- `idx_purchase_items_purchase` trên `purchase_items(purchase_id)`.
- `idx_purchase_items_product` trên `purchase_items(product_id)`.
- `idx_stock_movements_product_branch_created` trên `stock_movements(product_id, branch_id, created_at)`.
- `idx_products_active_category_name` trên `products(active, category, name)`.
- `idx_products_active_stock` trên `products(active, stock)`.
- `idx_branches_active_name` trên `branches(active, name)`.
- `idx_suppliers_active_name` trên `suppliers(active, name)`.
