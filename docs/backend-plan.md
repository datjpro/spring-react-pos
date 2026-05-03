# Backend Implementation Plan (Phase 1)

## 1) Objective

- Build backend foundation to implement modules in this order: `Auth` -> `Product` -> `Inventory`.
- Keep `Reports` at contract and dependency-definition level only in phase 1.
- Use Spring Boot layered architecture: `controller -> service -> repository -> entity/dto`.

## 2) Scope and Priority

### In scope
- Core backend foundation (error handling, validation, security config, migration baseline).
- Auth APIs:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- Product APIs:
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `GET /api/v1/products/{id}`
  - `PUT /api/v1/products/{id}`
  - `DELETE /api/v1/products/{id}`
  - `GET /api/v1/products/categories`
- Inventory APIs:
  - `POST /api/v1/inventory/adjustments`
  - `GET /api/v1/inventory/adjustments`
  - `GET /api/v1/inventory/low-stock`

### Out of scope
- Full implementation of order domain.
- Full business implementation for reports.

## 3) Architecture and Coding Standards

### Package layout
- Root package: `com.pos.backend`
- Layer packages:
  - `controller`
  - `service`
  - `repository`
  - `entity`
  - `dto`
  - `exception`
  - `config`

### Naming conventions
- Controller: `AuthController`, `ProductController`, `InventoryController`, `ReportController`
- Service: interface + implementation naming (`ProductService`, `ProductServiceImpl`)
- Repository: `*Repository`
- Entity: `*Entity`
- DTO: explicit request/response names (`CreateProductRequest`, `ProductResponse`)

### Code rules
- Controller handles HTTP mapping and DTO only.
- Service contains business logic.
- Repository isolates persistence.
- Never expose entity directly in API responses.
- Use Bean Validation for input validation (`@NotBlank`, `@NotNull`, `@PositiveOrZero`, `@Size`).
- Use clear variable/method names; avoid cryptic abbreviations.

## 4) Security and Database Strategy

### Security
- JWT-based authentication with Bearer token.
- Roles: `ADMIN`, `MANAGER`, `STAFF`.
- Public endpoints: auth login/refresh.
- Protected endpoints: all product/inventory endpoints.

### Database
- Engine: MySQL.
- Migration tool: Flyway.
- Add baseline migration and phase-1 schema migrations for:
  - users
  - refresh_tokens
  - products
  - inventory_adjustments

## 5) Error Response Contract

All handled errors should follow one unified schema:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Input data is invalid",
  "details": ["sku must not be blank"],
  "timestamp": "2026-05-03T00:00:00Z",
  "path": "/api/v1/products"
}
```

## 6) Test Policy

### Mandatory workflow
- Write tests first for each module scope.
- Run relevant tests before starting/running backend app.
- Only proceed when tests are green.

### Required tests
- Unit tests:
  - service logic for auth/product/inventory
  - DTO validation for key requests
  - global exception handler behavior
- Integration tests:
  - API/controller behavior for key endpoints
  - migration startup sanity (test profile when available)

### Acceptance scenarios
- Auth: success/failure login, refresh valid/expired, logout.
- Product: create/read/update/delete, paging/search, SKU uniqueness validation.
- Inventory: stock adjustment up/down, prevent invalid negative stock changes, history query, low-stock query.
- Security: role-based endpoint access is enforced.

## 7) Delivery and Commit Workflow

Phase commits (one logical scope per commit):

1. `docs: add backend implementation plan`
2. `chore: setup backend foundation`
3. `feat: add auth module`
4. `feat: add product module`
5. `feat: add inventory module`
6. `docs: add reports contract and dependencies`
7. `test: add backend unit and integration tests`

Each phase must include:
- Implementation complete for that scope.
- Tests added/updated for that scope.
- Tests executed and passing before commit.

## 8) Reports Contract in Phase 1

Phase-1 reports work is limited to API contract preparation and dependency definition:

- `GET /api/v1/reports/revenue`
- `GET /api/v1/reports/top-products`
- `GET /api/v1/reports/inventory-summary`
- `GET /api/v1/reports/export`

Dependencies that must be available before full reports implementation:
- `orders` table with `status`, `total_amount`, `created_at`
- `order_items` table with `product_id`, `quantity`, `unit_price`

