# Spring Boot & React POS System

Dự án POS dùng **Spring Boot** cho backend và **React + Vite** cho frontend.

## Cấu trúc
- `backend/`: REST API và business logic
- `frontend/`: giao diện quản trị
- `docs/`: tài liệu API, database, kiến trúc

## Phạm vi nghiệp vụ chính
- Bán hàng POS tại quầy qua `sales`
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
- Các group chính: `auth`, `users`, `catalog`, `operations`, `reporting`

## Chạy frontend
1. Cài dependency:
   - `cd frontend && npm install`
2. Chạy dev:
   - `npm run dev`
3. Frontend local mặc định:
   - `http://localhost:5173`
4. API base mặc định FE:
   - `http://localhost:8080/api/v1`

## FE bootstrap đã có
- Auth shell: login, lưu token, auto load `me`, logout, route guard
- Dashboard shell: gọi `reports/revenue` + `products` để hiện overview
- Products shell: list + search + loading/error states
- Route nghiệp vụ chính: `pos`, `products`, `purchases`, `sales`, `reports`, `users`

## E2E nghiệp vụ POS
- Script chính: `backend/scripts/run-business-e2e-report.ps1`
- Cleanup seed: `backend/scripts/cleanup-business-e2e-seed.ps1`
- Report output: `docs/test-reports/`
