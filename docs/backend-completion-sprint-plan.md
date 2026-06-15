# Kế hoạch sprint hoàn thiện full backend POS

## Mục tiêu hoàn thành
- Hoàn thiện toàn bộ backend theo luồng nghiệp vụ chính của hệ thống POS.
- Có đủ API, validation, phân quyền, test, tài liệu và Postman.
- Luồng chính: `auth`, `users`, `products`, `branches`, `suppliers`, `purchases`, `sales`, `stock-movements`, `audit-logs`, `reports`.
- Luồng legacy: `orders`, `payments`, `inventory` chỉ giữ để tương thích, không mở rộng nghiệp vụ mới.

## Nguyên tắc làm việc
- Mỗi nghiệp vụ làm theo chuỗi: entity/dto nếu cần → repository → service → controller → test → docs → Postman.
- Mỗi commit nhỏ, rõ phạm vi, nội dung commit bằng tiếng Việt.
- Không sửa frontend trong sprint này.
- Không refactor ngoài phạm vi backend nếu không cần.
- Sau mỗi ngày phải chạy test liên quan; cuối sprint chạy full test backend.

## Definition of Done
- API chính có đủ endpoint cần thiết cho vận hành POS.
- Nhập hàng, bán hàng, hủy phiếu đều cập nhật tồn kho đúng.
- Mọi nghiệp vụ ghi `stock_movements` và `audit_logs` khi cần.
- Phân quyền `ADMIN`, `MANAGER`, `STAFF` đúng scope.
- Có test controller/service cho nghiệp vụ chính.
- `docs/api.md`, `docs/database.md`, `docs/architecture.md`, Postman khớp code.

---

## Day 1 - Khóa phạm vi backend và chuẩn hóa danh mục

### Nhiệm vụ 1.1 - Rà API chính và legacy
- Kiểm tra lại toàn bộ controller hiện có.
- Xác nhận API chính và API legacy trong docs.
- Không thay đổi logic runtime.

Commit:
- `docs: chốt phạm vi API chính và API legacy cho backend POS`

### Nhiệm vụ 1.2 - Thêm API chi tiết chi nhánh
Endpoint:
- `GET /api/v1/branches/{id}`

Việc cần làm:
- Thêm `findById(Long id)` vào `BranchService`.
- Implement trong `BranchServiceImpl`.
- Thêm route trong `BranchController`.
- Trả `BranchResponse`.
- Nếu không tồn tại, trả lỗi `ResourceNotFoundException`.

Test cần có:
- Lấy chi nhánh thành công.
- Không tìm thấy chi nhánh.
- Validate id nhỏ hơn 1.

Commit:
- `feat: thêm API lấy chi tiết chi nhánh theo id`
- `test: bổ sung kiểm thử API chi tiết chi nhánh`

### Nhiệm vụ 1.3 - Thêm API chi tiết nhà cung cấp
Endpoint:
- `GET /api/v1/suppliers/{id}`

Việc cần làm:
- Thêm `findById(Long id)` vào `SupplierService`.
- Implement trong `SupplierServiceImpl`.
- Thêm route trong `SupplierController`.
- Trả `SupplierResponse`.
- Nếu không tồn tại, trả lỗi `ResourceNotFoundException`.

Test cần có:
- Lấy nhà cung cấp thành công.
- Không tìm thấy nhà cung cấp.
- Validate id nhỏ hơn 1.

Commit:
- `feat: thêm API lấy chi tiết nhà cung cấp theo id`
- `test: bổ sung kiểm thử API chi tiết nhà cung cấp`

### Nhiệm vụ 1.4 - Cập nhật tài liệu và Postman danh mục
- Cập nhật `docs/api.md`.
- Cập nhật Postman folder `02 - Chi nhánh` và `03 - Nhà cung cấp`.

Commit:
- `docs: cập nhật tài liệu và Postman cho API chi tiết danh mục`

---

## Day 2 - Hoàn thiện nghiệp vụ nhập hàng

### Nhiệm vụ 2.1 - Thêm API chi tiết phiếu nhập
Endpoint:
- `GET /api/v1/purchases/{id}`

Việc cần làm:
- Thêm `findById(Long id)` vào `PurchaseService`.
- Implement query lấy purchase kèm items nếu cần.
- Thêm route trong `PurchaseController`.
- Trả `PurchaseResponse` đầy đủ items.
- Kiểm tra quyền `ADMIN`, `MANAGER`.

Test cần có:
- Lấy phiếu nhập thành công.
- Không tìm thấy phiếu nhập.
- User không đủ quyền bị chặn.

Commit:
- `feat: thêm API lấy chi tiết phiếu nhập theo id`
- `test: bổ sung kiểm thử API chi tiết phiếu nhập`

### Nhiệm vụ 2.2 - Thêm API hủy phiếu nhập
Endpoint:
- `POST /api/v1/purchases/{id}/cancel`

Việc cần làm:
- Tạo DTO `CancelPurchaseRequest` nếu cần ghi lý do.
- Thêm trạng thái hủy nếu enum `PurchaseStatus` chưa đủ.
- Khi hủy, trừ lại số lượng đã nhập khỏi tồn kho.
- Chặn hủy nếu tồn kho hiện tại không đủ để hoàn tác.
- Chặn hủy phiếu đã hủy.
- Ghi `stock_movements` loại hoàn tác nhập hàng.
- Ghi `audit_logs`.
- Toàn bộ chạy trong transaction.

Test cần có:
- Hủy phiếu nhập thành công và tồn kho giảm đúng.
- Hủy phiếu nhập không tồn tại.
- Hủy phiếu đã hủy bị lỗi.
- Hủy gây âm kho bị lỗi.
- Có ghi stock movement và audit log.

Commit:
- `feat: thêm API hủy phiếu nhập và hoàn tác tồn kho`
- `test: bổ sung kiểm thử hủy phiếu nhập và tồn kho`

### Nhiệm vụ 2.3 - Cập nhật tài liệu và Postman nhập hàng
- Cập nhật `docs/api.md` phần purchase.
- Cập nhật `docs/database.md` nếu có thay đổi enum/trạng thái.
- Cập nhật Postman folder `04 - Nhập hàng`.

Commit:
- `docs: cập nhật tài liệu nhập hàng và hủy phiếu nhập`

---

## Day 3 - Hoàn thiện nghiệp vụ bán hàng

### Nhiệm vụ 3.1 - Thêm API chi tiết hóa đơn bán
Endpoint:
- `GET /api/v1/sales/{id}`

Việc cần làm:
- Thêm `findById(Long id)` vào `SaleService`.
- Implement trong `SaleServiceImpl`.
- Thêm route trong `SaleController`.
- Trả `SaleResponse` đầy đủ items.
- Kiểm tra quyền `ADMIN`, `MANAGER`, có thể mở `STAFF` theo scope nếu cần.

Test cần có:
- Lấy hóa đơn thành công.
- Không tìm thấy hóa đơn.
- User không đủ quyền bị chặn.

Commit:
- `feat: thêm API lấy chi tiết hóa đơn bán theo id`
- `test: bổ sung kiểm thử API chi tiết hóa đơn bán`

### Nhiệm vụ 3.2 - Thêm API hủy hóa đơn bán
Endpoint:
- `POST /api/v1/sales/{id}/cancel`

Việc cần làm:
- Tạo DTO `CancelSaleRequest` nếu cần ghi lý do.
- Thêm trạng thái hủy nếu enum `SaleStatus` chưa đủ.
- Khi hủy, cộng lại số lượng đã bán vào tồn kho.
- Chặn hủy hóa đơn đã hủy.
- Ghi `stock_movements` loại hoàn tác bán hàng.
- Ghi `audit_logs`.
- Toàn bộ chạy trong transaction.

Test cần có:
- Hủy hóa đơn thành công và tồn kho tăng đúng.
- Hủy hóa đơn không tồn tại.
- Hủy hóa đơn đã hủy bị lỗi.
- Có ghi stock movement và audit log.

Commit:
- `feat: thêm API hủy hóa đơn bán và hoàn tác tồn kho`
- `test: bổ sung kiểm thử hủy hóa đơn bán và hoàn kho`

### Nhiệm vụ 3.3 - Rà lại chống âm kho khi bán
- Kiểm tra `SaleServiceImpl` đã chặn âm kho trong mọi item.
- Nếu nhiều item trùng product, phải tính tổng trước khi trừ.
- Nếu lỗi, sửa logic gom số lượng theo product.

Commit:
- `fix: chặn âm kho khi hóa đơn có nhiều dòng cùng sản phẩm`
- `test: bổ sung kiểm thử chống âm kho khi bán hàng`

### Nhiệm vụ 3.4 - Cập nhật tài liệu và Postman bán hàng
- Cập nhật `docs/api.md` phần sale.
- Cập nhật Postman folder `05 - Bán hàng`.

Commit:
- `docs: cập nhật tài liệu bán hàng và hủy hóa đơn`

---

## Day 4 - Quản trị người dùng và phân quyền

### Nhiệm vụ 4.1 - Thêm DTO và service user
Endpoint cần có:
- `GET /api/v1/users`
- `GET /api/v1/users/me`
- `POST /api/v1/users`
- `PUT /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}/active`

DTO cần có:
- `CreateUserRequest`
- `UpdateUserRequest`
- `UpdateUserActiveRequest`
- `UserResponse`

Service cần có:
- `UserService`
- `UserServiceImpl`

Commit:
- `feat: thêm DTO và service quản trị người dùng`

### Nhiệm vụ 4.2 - Thêm API danh sách và hồ sơ hiện tại
Endpoint:
- `GET /api/v1/users`
- `GET /api/v1/users/me`

Rule:
- `GET /users`: chỉ `ADMIN`.
- `GET /users/me`: mọi user đã đăng nhập.
- Không trả password.

Commit:
- `feat: thêm API danh sách người dùng và hồ sơ hiện tại`
- `test: bổ sung kiểm thử API danh sách người dùng và hồ sơ hiện tại`

### Nhiệm vụ 4.3 - Thêm API tạo và cập nhật user
Endpoint:
- `POST /api/v1/users`
- `PUT /api/v1/users/{id}`

Rule:
- Chỉ `ADMIN` tạo/sửa user.
- Username unique.
- Password phải mã hóa BCrypt.
- Role hợp lệ: `ADMIN`, `MANAGER`, `STAFF`.
- Nếu role không phải ADMIN thì nên có `branchId`.

Commit:
- `feat: thêm API tạo và cập nhật tài khoản người dùng`
- `test: bổ sung kiểm thử tạo và cập nhật người dùng`

### Nhiệm vụ 4.4 - Thêm API khóa/mở tài khoản
Endpoint:
- `PATCH /api/v1/users/{id}/active`

Rule:
- Chỉ `ADMIN`.
- Không cho admin tự khóa chính mình nếu cần an toàn.
- User inactive không đăng nhập được.

Commit:
- `feat: thêm API khóa mở tài khoản người dùng`
- `test: bổ sung kiểm thử khóa mở tài khoản người dùng`

### Nhiệm vụ 4.5 - Cập nhật docs/Postman user
- Thêm folder `10 - Quản trị người dùng` trong Postman.
- Cập nhật `docs/api.md`.

Commit:
- `docs: cập nhật tài liệu quản trị người dùng và phân quyền`

---

## Day 5 - Báo cáo nâng cao

### Nhiệm vụ 5.1 - Báo cáo lợi nhuận
Endpoint:
- `GET /api/v1/reports/profit`

Query:
- `from`
- `to`
- `groupBy`
- `branchId`

Logic:
- Doanh thu từ sale.
- Giá vốn từ product cost hoặc sale item snapshot nếu sau này bổ sung.
- Lợi nhuận = doanh thu - giá vốn.

Commit:
- `feat: bổ sung API báo cáo lợi nhuận theo thời gian`
- `test: bổ sung kiểm thử báo cáo lợi nhuận`

### Nhiệm vụ 5.2 - Báo cáo thẻ kho
Endpoint:
- `GET /api/v1/reports/stock-card`

Query:
- `productId`
- `branchId`
- `from`
- `to`

Logic:
- Lấy stock movement theo sản phẩm/chi nhánh/khoảng thời gian.
- Trả danh sách nhập/xuất/điều chỉnh theo thời gian.

Commit:
- `feat: bổ sung API thẻ kho theo sản phẩm và chi nhánh`
- `test: bổ sung kiểm thử báo cáo thẻ kho`

### Nhiệm vụ 5.3 - Báo cáo tổng hợp nhập hàng
Endpoint:
- `GET /api/v1/reports/purchase-summary`

Query:
- `from`
- `to`
- `supplierId`
- `branchId`

Logic:
- Tổng số phiếu nhập.
- Tổng tiền nhập.
- Tổng số lượng nhập.
- Nhóm theo nhà cung cấp hoặc chi nhánh nếu cần.

Commit:
- `feat: bổ sung API tổng hợp nhập hàng`
- `test: bổ sung kiểm thử báo cáo tổng hợp nhập hàng`

### Nhiệm vụ 5.4 - Báo cáo tổng hợp bán hàng
Endpoint:
- `GET /api/v1/reports/sales-summary`

Query:
- `from`
- `to`
- `branchId`
- `createdBy`

Logic:
- Tổng số hóa đơn.
- Tổng doanh thu.
- Tổng số lượng bán.
- Nhóm theo chi nhánh hoặc nhân viên nếu cần.

Commit:
- `feat: bổ sung API tổng hợp bán hàng`
- `test: bổ sung kiểm thử báo cáo tổng hợp bán hàng`

### Nhiệm vụ 5.5 - Mở rộng export CSV
Endpoint hiện có:
- `GET /api/v1/reports/export`

Thêm `type`:
- `profit`
- `stock-card`
- `purchase-summary`
- `sales-summary`

Commit:
- `feat: mở rộng export csv cho báo cáo nâng cao`
- `test: bổ sung kiểm thử export csv báo cáo nâng cao`
- `docs: cập nhật tài liệu báo cáo nâng cao và export csv`

---

## Day 6 - Kiểm thử còn thiếu cho backend hiện tại

### Nhiệm vụ 6.1 - Test controller còn thiếu
Bổ sung test cho:
- `BranchController`
- `SupplierController`
- `PurchaseController`
- `SaleController`
- `StockMovementController`
- `AuditLogController`

Commit:
- `test: bổ sung kiểm thử controller cho danh mục và nghiệp vụ chính`

### Nhiệm vụ 6.2 - Test service còn thiếu
Bổ sung test cho:
- `BranchServiceImpl`
- `SupplierServiceImpl`
- `PurchaseServiceImpl`
- `SaleServiceImpl`
- `StockMovementServiceImpl`
- `AuditLogServiceImpl`

Commit:
- `test: bổ sung kiểm thử service cho luồng nhập bán tồn kho audit`

### Nhiệm vụ 6.3 - Test phân quyền và branch scope
Tình huống:
- `ADMIN` truy cập mọi chi nhánh.
- `MANAGER` chỉ truy cập chi nhánh của mình.
- `STAFF` chỉ thao tác nghiệp vụ được phép.
- Token thiếu/sai trả `401`.
- Không đủ quyền trả `403`.

Commit:
- `test: bổ sung kiểm thử phân quyền và phạm vi chi nhánh`

---

## Day 7 - Tồn kho đa chi nhánh chuẩn (tùy chọn nhưng nên làm nếu muốn full thật)

### Nhiệm vụ 7.1 - Thêm bảng tồn kho theo chi nhánh
Migration:
- `branch_product_stocks`

Cột đề xuất:
- `id`
- `branch_id`
- `product_id`
- `stock`
- `created_at`
- `updated_at`

Constraint:
- Unique `(branch_id, product_id)`.
- Stock không âm.

Commit:
- `feat: thêm bảng tồn kho theo chi nhánh`

### Nhiệm vụ 7.2 - Refactor nhập hàng sang tồn kho chi nhánh
- Khi nhập hàng, tăng stock trong `branch_product_stocks`.
- Vẫn có thể cập nhật `products.stock` tổng nếu muốn giữ tương thích.

Commit:
- `refactor: chuyển nhập hàng sang tồn kho theo chi nhánh`

### Nhiệm vụ 7.3 - Refactor bán hàng sang tồn kho chi nhánh
- Khi bán hàng, trừ stock theo `branchId`.
- Chặn âm kho theo chi nhánh, không theo tồn tổng.

Commit:
- `refactor: chuyển bán hàng sang tồn kho theo chi nhánh`

### Nhiệm vụ 7.4 - Refactor điều chỉnh kho sang tồn kho chi nhánh
- Điều chỉnh `branch_product_stocks`.
- Ghi movement đúng branch.

Commit:
- `refactor: chuyển điều chỉnh kho sang tồn kho theo chi nhánh`

### Nhiệm vụ 7.5 - Test và docs tồn kho đa chi nhánh
Commit:
- `test: bổ sung kiểm thử tồn kho đa chi nhánh`
- `docs: cập nhật mô hình tồn kho đa chi nhánh`

---

## Day 8 - Hardening và dọn legacy

### Nhiệm vụ 8.1 - Rà legacy controller
- Giữ `@Deprecated` cho `OrderController`, `PaymentController`, `InventoryController`.
- Không thêm nghiệp vụ mới vào legacy.
- Docs nêu rõ chỉ dùng tương thích.

Commit:
- `refactor: chuẩn hóa trạng thái legacy cho order payment inventory`

### Nhiệm vụ 8.2 - Tối ưu query và index
Rà các endpoint tải lớn:
- Product list.
- Stock movement list.
- Audit log list.
- Report theo thời gian.

Commit:
- `fix: tối ưu truy vấn và chỉ mục cho endpoint dữ liệu lớn`

### Nhiệm vụ 8.3 - Chuẩn hóa response cuối cùng
- Không trả entity trực tiếp.
- DTO thống nhất field.
- Error response thống nhất.

Commit:
- `refactor: chuẩn hóa dto response và lỗi backend`

---

## Day 9 - Chốt tài liệu, Postman và full test

### Nhiệm vụ 9.1 - Cập nhật docs cuối cùng
Files:
- `docs/api.md`
- `docs/database.md`
- `docs/architecture.md`
- `docs/endpoint-completion-plan.md`

Commit:
- `docs: hoàn thiện tài liệu backend POS sau khi chốt API`

### Nhiệm vụ 9.2 - Cập nhật Postman cuối cùng
- Thêm user API.
- Thêm purchase detail/cancel.
- Thêm sale detail/cancel.
- Thêm report nâng cao.
- Thêm test case lỗi cơ bản: 400, 401, 403, 404.

Commit:
- `docs: hoàn thiện bộ Postman tiếng Việt cho full backend`

### Nhiệm vụ 9.3 - Chạy full test backend
Lệnh:
- `cd backend; mvn test`

Nếu pass:
Commit:
- `chore: chốt backend POS sẵn sàng tích hợp frontend`

Nếu fail:
- Sửa đúng lỗi liên quan.
- Không sửa lan man ngoài phạm vi.

---

## Thứ tự ưu tiên nếu thiếu thời gian
1. Day 1: chi tiết branch/supplier.
2. Day 2: purchase detail/cancel.
3. Day 3: sale detail/cancel.
4. Day 6: test controller/service còn thiếu.
5. Day 4: user management.
6. Day 5: report nâng cao.
7. Day 7: tồn kho đa chi nhánh chuẩn.
8. Day 8-9: hardening, docs, Postman, full test.

## Danh sách commit dự kiến theo thứ tự
1. `docs: chốt phạm vi API chính và API legacy cho backend POS`
2. `feat: thêm API lấy chi tiết chi nhánh theo id`
3. `test: bổ sung kiểm thử API chi tiết chi nhánh`
4. `feat: thêm API lấy chi tiết nhà cung cấp theo id`
5. `test: bổ sung kiểm thử API chi tiết nhà cung cấp`
6. `docs: cập nhật tài liệu và Postman cho API chi tiết danh mục`
7. `feat: thêm API lấy chi tiết phiếu nhập theo id`
8. `test: bổ sung kiểm thử API chi tiết phiếu nhập`
9. `feat: thêm API hủy phiếu nhập và hoàn tác tồn kho`
10. `test: bổ sung kiểm thử hủy phiếu nhập và tồn kho`
11. `docs: cập nhật tài liệu nhập hàng và hủy phiếu nhập`
12. `feat: thêm API lấy chi tiết hóa đơn bán theo id`
13. `test: bổ sung kiểm thử API chi tiết hóa đơn bán`
14. `feat: thêm API hủy hóa đơn bán và hoàn tác tồn kho`
15. `test: bổ sung kiểm thử hủy hóa đơn bán và hoàn kho`
16. `fix: chặn âm kho khi hóa đơn có nhiều dòng cùng sản phẩm`
17. `test: bổ sung kiểm thử chống âm kho khi bán hàng`
18. `docs: cập nhật tài liệu bán hàng và hủy hóa đơn`
19. `feat: thêm DTO và service quản trị người dùng`
20. `feat: thêm API danh sách người dùng và hồ sơ hiện tại`
21. `test: bổ sung kiểm thử API danh sách người dùng và hồ sơ hiện tại`
22. `feat: thêm API tạo và cập nhật tài khoản người dùng`
23. `test: bổ sung kiểm thử tạo và cập nhật người dùng`
24. `feat: thêm API khóa mở tài khoản người dùng`
25. `test: bổ sung kiểm thử khóa mở tài khoản người dùng`
26. `docs: cập nhật tài liệu quản trị người dùng và phân quyền`
27. `feat: bổ sung API báo cáo lợi nhuận theo thời gian`
28. `test: bổ sung kiểm thử báo cáo lợi nhuận`
29. `feat: bổ sung API thẻ kho theo sản phẩm và chi nhánh`
30. `test: bổ sung kiểm thử báo cáo thẻ kho`
31. `feat: bổ sung API tổng hợp nhập hàng`
32. `test: bổ sung kiểm thử báo cáo tổng hợp nhập hàng`
33. `feat: bổ sung API tổng hợp bán hàng`
34. `test: bổ sung kiểm thử báo cáo tổng hợp bán hàng`
35. `feat: mở rộng export csv cho báo cáo nâng cao`
36. `test: bổ sung kiểm thử export csv báo cáo nâng cao`
37. `docs: cập nhật tài liệu báo cáo nâng cao và export csv`
38. `test: bổ sung kiểm thử controller cho danh mục và nghiệp vụ chính`
39. `test: bổ sung kiểm thử service cho luồng nhập bán tồn kho audit`
40. `test: bổ sung kiểm thử phân quyền và phạm vi chi nhánh`
41. `feat: thêm bảng tồn kho theo chi nhánh`
42. `refactor: chuyển nhập hàng sang tồn kho theo chi nhánh`
43. `refactor: chuyển bán hàng sang tồn kho theo chi nhánh`
44. `refactor: chuyển điều chỉnh kho sang tồn kho theo chi nhánh`
45. `test: bổ sung kiểm thử tồn kho đa chi nhánh`
46. `docs: cập nhật mô hình tồn kho đa chi nhánh`
47. `refactor: chuẩn hóa trạng thái legacy cho order payment inventory`
48. `fix: tối ưu truy vấn và chỉ mục cho endpoint dữ liệu lớn`
49. `refactor: chuẩn hóa dto response và lỗi backend`
50. `docs: hoàn thiện tài liệu backend POS sau khi chốt API`
51. `docs: hoàn thiện bộ Postman tiếng Việt cho full backend`
52. `chore: chốt backend POS sẵn sàng tích hợp frontend`
