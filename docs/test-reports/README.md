# Business E2E Test Reports

Thư mục này chứa report Markdown được sinh bởi script `backend/scripts/run-business-e2e-report.ps1`.

Script này kiểm tra end-to-end hầu hết endpoint backend: auth, users, branches, suppliers, products, orders, payments, inventory, stock-movements, purchases, sales, reports, audit-logs.

## Ý nghĩa field trong report
- `Status`: kết quả cuối của toàn bộ lần chạy.
- `Started at`: thời điểm bắt đầu chạy.
- `Ended at`: thời điểm kết thúc chạy.
- `Base URL`: địa chỉ backend được test.
- `PostgreSQL container`: tên container PostgreSQL mà script ưu tiên dùng khi truy cập DB.
- `Run ID`: mã định danh lần chạy, đồng thời là suffix cho seed E2E.

## Ý nghĩa trạng thái
- `PASSED`: tất cả step đều `PASS`, không có endpoint nào bị skip.
- `PASSED_WITH_SKIPS`: có ít nhất một step `SKIP`, chỉ xuất hiện khi chạy với `-AllowEndpointSkips`.
- `FAILED`: có ít nhất một step `FAIL`, script dừng ngay tại step lỗi.

## Cách đọc step fail
- Mỗi dòng trong mục `## Steps` có format: trạng thái, timestamp, tên step, chi tiết lỗi hoặc kết quả.
- Khi thấy `FAIL`, đọc phần detail ở cuối dòng để biết request nào hỏng hoặc assert nào sai.
- Khi thấy `SKIP`, backend hiện tại thiếu endpoint tương ứng hoặc endpoint trả lỗi và lần chạy có bật `-AllowEndpointSkips`.

## Rerun và cleanup
- Cleanup seed E2E:
  - `powershell -ExecutionPolicy Bypass -File backend/scripts/cleanup-business-e2e-seed.ps1`
- Chạy lại E2E chuẩn:
  - `powershell -ExecutionPolicy Bypass -File backend/scripts/run-business-e2e-report.ps1 -SkipDockerUp -AdminPassword postgres -PostgresPassword postgres`
- Chạy lại E2E có cho skip endpoint:
  - `powershell -ExecutionPolicy Bypass -File backend/scripts/run-business-e2e-report.ps1 -SkipDockerUp -AdminPassword postgres -PostgresPassword postgres -AllowEndpointSkips`

## Lưu ý commit
- Không commit file report sinh ra như `docs/test-reports/business-e2e-*.md`.
- Chỉ commit file hướng dẫn này khi cần cập nhật tài liệu.
