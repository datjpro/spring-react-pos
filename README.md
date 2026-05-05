# Spring Boot & React POS System

D? ?n POS d?ng **Spring Boot** cho backend v? **React** cho frontend.

## C?u tr?c
- `backend/`: API Spring Boot
- `frontend/`: UI React
- `docs/`: t?i li?u thi?t k? v? API

## Y?u c?u
- Java 17+
- Node.js 18+
- Docker + Docker Compose

## Ch?y backend b?ng Docker

1. T?o file env t? m?u:
   - `Copy-Item .env.example .env`
2. Ch?y PostgreSQL + backend:
   - `docker compose up -d --build`
3. Xem log backend:
   - `docker compose logs -f backend`
4. D?ng d?ch v?:
   - `docker compose down`

## Port m?c ??nh
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Bi?n m?i tr??ng Docker
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE`

## Ghi ch?
- Backend container ch?y profile `prod`.
- Flyway t? migrate khi app kh?i ??ng.
- Admin bootstrap m?c ??nh: `admin / postgres` n?u kh?ng ??i trong `.env`.
