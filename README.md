# Spring Boot & React POS System

Dự án POS dùng **Spring Boot** cho backend và **React** cho frontend.

## Cấu trúc
- `backend/`: API Spring Boot
- `frontend/`: UI React
- `docs/`: tài liệu thiết kế và API

## Yêu cầu
- Java 17+
- Node.js 18+
- Docker + Docker Compose

## Chạy backend bằng Docker
1. Tạo file env từ mẫu:
   - `Copy-Item .env.example .env`
2. Chạy PostgreSQL + backend:
   - `docker compose up -d --build`
3. Xem log backend:
   - `docker compose logs -f backend`
4. Dừng dịch vụ:
   - `docker compose down`

## Port mặc định
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Biến môi trường Docker
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE`

## E2E nghiệp vụ POS

Script chính: `backend/scripts/run-business-e2e-report.ps1`.

Script hiện cover các nhóm endpoint backend chính:
- `auth`: login, refresh, logout
- `users`: list, me, create, update, active
- `branches`: list, get, create, update, delete
- `suppliers`: list, get, create, update, delete
- `products`: list, categories, get, create, update, delete
- `orders`: list, get, create, cancel
- `payments`: list theo order, get, create
- `inventory`: adjustments, list adjustments, low-stock
- `stock-movements`: list, adjustments
- `purchases`: list, get, create, cancel
- `sales`: list, get, create, cancel
- `reports`: revenue, profit, top-products, inventory-summary, stock-card, purchase-summary, sales-summary, export
- `audit-logs`: list

### 1) Chạy E2E chuẩn (không cho skip endpoint)
```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/run-business-e2e-report.ps1 -SkipDockerUp -AdminPassword postgres -PostgresPassword postgres
```

### 2) Chạy E2E với `-AllowEndpointSkips`
```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/run-business-e2e-report.ps1 -SkipDockerUp -AdminPassword postgres -PostgresPassword postgres -AllowEndpointSkips
```

### 3) Cleanup seed E2E
```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/cleanup-business-e2e-seed.ps1
```

Report sinh tại `docs/test-reports/`.
Xem hướng dẫn đọc report tại `docs/test-reports/README.md`.
