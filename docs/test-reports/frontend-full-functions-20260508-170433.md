# Frontend Full Functions Report

- Time: 2026-05-08 17:04:33
- Scope: admin-first FE, minimal UI, cover all backend endpoints
- FE base API: http://localhost:8080/api/v1

## Implemented modules
- Auth: login, logout, me, refresh token tool
- Dashboard: revenue overview + product count
- Products: list, detail, create, update, delete, categories
- Master data: branches + suppliers CRUD actions
- Users: list, create, update, active toggle
- Purchases: list, detail, create, cancel
- Sales: list, detail, create, cancel
- Orders & Payments: create/list/detail/cancel order, create/list/detail payment
- Inventory: adjustments, low stock, stock movements, stock adjustment
- Reports: revenue, profit, top-products, inventory-summary, stock-card, purchase-summary, sales-summary, csv export preview
- System: audit logs

## Route map
- /login
- /
- /products
- /master-data
- /users
- /auth-tools
- /purchases
- /sales
- /orders
- /pos
- /inventory
- /reports
- /system

## Validation checklist
- Login with backend admin account
- Verify protected route redirect when no token
- Open each page and run at least one action
- Confirm report pages return data and csv preview
- Confirm create/update/delete actions return backend response or backend error message

## Notes
- UI intentionally simple; focus is endpoint coverage and operability
- Some actions use sample ids like 1 or 2; if local DB differs, backend may return not found but page wiring remains valid
- Logout endpoint is available through sidebar action; refresh token is available in Auth Tools page
