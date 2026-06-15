# Spring Boot & React POS System

Dự án POS dùng **Spring Boot** cho backend và **React + Vite** cho frontend.

## Cấu trúc
- `backend/`: REST API và business logic
- `frontend/`: giao diện quản trị
- `docs/`: tài liệu API, database, kiến trúc

## Luồng nghiệp vụ chính
- Bán hàng tại quầy qua `sales` (không dùng luồng legacy `orders/payments`)
- Nhập hàng từ nhà cung cấp qua `purchases`
- Quản lý tồn kho đa chi nhánh qua `branch_product_stocks`
- Điều chỉnh kho qua `stock-movements/adjustments`
- Báo cáo và audit log phục vụ quản trị

## Chạy backend
1. Tạo `.env` từ `.env.example`
2. Chạy:
   - `docker compose up -d --build backend`
3. API local:
   - `http://localhost:8080`

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Nhóm chính: `auth`, `users`, `catalog`, `operations`, `reporting`

## Chạy frontend
1. Cài dependency:
   - `cd frontend && npm install`
2. Chạy dev:
   - `npm run dev`
3. Frontend local mặc định:
   - `http://localhost:5173`
4. API base mặc định FE:
   - `http://localhost:8080/api/v1`

## FE main flow sau refactor
- Dashboard: doanh thu + số hóa đơn bán + quick links chính
- Products: danh sách, tìm kiếm, tồn tổng theo `products.stock`
- Purchases/Sales: tạo và xem giao dịch nhập/bán
- POS: tạo phiếu bán trực tiếp qua `POST /sales`
- Inventory:
  - Tồn theo chi nhánh từ `GET /stock-levels`
  - Biến động kho từ `GET /stock-movements`
  - Điều chỉnh kho qua `POST /stock-movements/adjustments`
- Reports, Users, System/Auth Tools: giữ theo API hiện tại

## E2E nghiệp vụ POS
- Script chính: `backend/scripts/run-business-e2e-report.ps1`
- Cleanup seed: `backend/scripts/cleanup-business-e2e-seed.ps1`
- Report output: `docs/test-reports/`
