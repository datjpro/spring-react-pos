# API

## Authentication
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Products
- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/products/{id}`
- `PUT /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`

## Branches
- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `PUT /api/v1/branches/{id}`
- `DELETE /api/v1/branches/{id}`

## Suppliers
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `PUT /api/v1/suppliers/{id}`
- `DELETE /api/v1/suppliers/{id}`

## Purchases
- `POST /api/v1/purchases`
- `GET /api/v1/purchases`

## Sales
- `POST /api/v1/sales`
- `GET /api/v1/sales`

## Stock
- `GET /api/v1/stock-movements`
- `POST /api/v1/stock-movements/adjustments`

## Audit
- `GET /api/v1/audit-logs`

## Report (ưu tiên theo đề tài)
- `GET /api/v1/reports/revenue`
- `GET /api/v1/reports/top-products`
- `GET /api/v1/reports/inventory-summary`

## Ghi chú
- `order/payment/inventory` là legacy, không phải hướng chính.
- Luồng chuẩn phải đi qua `sale/purchase/stock/audit`.
