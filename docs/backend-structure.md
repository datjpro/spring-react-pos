# Backend Project Structure — Spring Boot POS System

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Spring Boot 3.x (Java 17+) |
| Database | MySQL 8.x |
| ORM | Spring Data JPA + Hibernate |
| Migration | Flyway |
| Auth | Spring Security + JWT (jjwt) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Test | JUnit 5 + Mockito + Testcontainers |

---

## Cấu trúc thư mục

```
backend/
├── pom.xml
├── .env.example
├── .gitignore
│
└── src/
    ├── main/
    │   ├── java/com/pos/
    │   │   │
    │   │   ├── PosApplication.java                  # Entry point
    │   │   │
    │   │   ├── config/                              # Cấu hình toàn cục
    │   │   │   ├── SecurityConfig.java              # Spring Security, CORS, filter chain
    │   │   │   ├── JwtConfig.java                   # JWT secret, expiry properties
    │   │   │   ├── OpenApiConfig.java               # Swagger / OpenAPI config
    │   │   │   ├── AuditConfig.java                 # Spring Data Auditing (createdBy, updatedAt)
    │   │   │   └── WebConfig.java                   # CORS, MVC config
    │   │   │
    │   │   ├── common/                              # Dùng chung toàn app
    │   │   │   ├── entity/
    │   │   │   │   └── BaseEntity.java              # id, createdAt, updatedAt (abstract)
    │   │   │   ├── dto/
    │   │   │   │   ├── ApiResponse.java             # Wrapper response chuẩn {data, message, status}
    │   │   │   │   └── PageResponse.java            # Wrapper phân trang
    │   │   │   ├── exception/
    │   │   │   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
    │   │   │   │   ├── ResourceNotFoundException.java
    │   │   │   │   ├── BusinessException.java       # Lỗi nghiệp vụ (stock âm, SKU trùng...)
    │   │   │   │   └── UnauthorizedException.java
    │   │   │   ├── enums/
    │   │   │   │   ├── Role.java                    # ADMIN, MANAGER, CASHIER
    │   │   │   │   ├── OrderStatus.java             # PENDING, COMPLETED, CANCELLED
    │   │   │   │   ├── PaymentMethod.java           # CASH, CARD, QR, TRANSFER
    │   │   │   │   ├── PaymentStatus.java           # PENDING, SUCCESS, FAILED, REFUNDED
    │   │   │   │   └── AdjustmentType.java          # IMPORT, EXPORT, LOSS, AUDIT
    │   │   │   └── util/
    │   │   │       ├── OrderCodeGenerator.java      # Sinh mã đơn ORD-20250503-001
    │   │   │       └── PageableUtils.java           # Build Pageable từ request params
    │   │   │
    │   │   ├── auth/                                # Module xác thực
    │   │   │   ├── controller/
    │   │   │   │   └── AuthController.java          # POST /api/v1/auth/*
    │   │   │   ├── dto/
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── LoginResponse.java
    │   │   │   │   └── RefreshTokenRequest.java
    │   │   │   ├── entity/
    │   │   │   │   └── RefreshToken.java
    │   │   │   ├── repository/
    │   │   │   │   └── RefreshTokenRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── AuthService.java
    │   │   │   │   └── RefreshTokenService.java
    │   │   │   └── security/
    │   │   │       ├── JwtTokenProvider.java        # Generate / validate JWT
    │   │   │       ├── JwtAuthFilter.java           # OncePerRequestFilter
    │   │   │       └── UserDetailsServiceImpl.java  # Load user từ DB
    │   │   │
    │   │   ├── user/                                # Module người dùng
    │   │   │   ├── controller/
    │   │   │   │   └── UserController.java          # GET/POST /api/v1/users
    │   │   │   ├── dto/
    │   │   │   │   ├── CreateUserRequest.java
    │   │   │   │   ├── UpdateUserRequest.java
    │   │   │   │   └── UserResponse.java
    │   │   │   ├── entity/
    │   │   │   │   └── User.java
    │   │   │   ├── repository/
    │   │   │   │   └── UserRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── UserService.java             # Interface
    │   │   │   │   └── UserServiceImpl.java
    │   │   │   └── mapper/
    │   │   │       └── UserMapper.java              # Entity ↔ DTO (MapStruct)
    │   │   │
    │   │   ├── product/                             # Module sản phẩm & danh mục
    │   │   │   ├── controller/
    │   │   │   │   ├── ProductController.java       # /api/v1/products
    │   │   │   │   └── CategoryController.java      # /api/v1/categories
    │   │   │   ├── dto/
    │   │   │   │   ├── CreateProductRequest.java
    │   │   │   │   ├── UpdateProductRequest.java
    │   │   │   │   ├── ProductResponse.java
    │   │   │   │   ├── ProductSummaryResponse.java  # Dùng trong danh sách (ít field hơn)
    │   │   │   │   ├── CreateCategoryRequest.java
    │   │   │   │   └── CategoryResponse.java
    │   │   │   ├── entity/
    │   │   │   │   ├── Product.java
    │   │   │   │   └── Category.java
    │   │   │   ├── repository/
    │   │   │   │   ├── ProductRepository.java       # Có custom query tìm kiếm, lọc
    │   │   │   │   └── CategoryRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── ProductService.java
    │   │   │   │   ├── ProductServiceImpl.java
    │   │   │   │   ├── CategoryService.java
    │   │   │   │   └── CategoryServiceImpl.java
    │   │   │   └── mapper/
    │   │   │       ├── ProductMapper.java
    │   │   │       └── CategoryMapper.java
    │   │   │
    │   │   ├── inventory/                           # Module kho hàng
    │   │   │   ├── controller/
    │   │   │   │   └── InventoryController.java     # /api/v1/inventory
    │   │   │   ├── dto/
    │   │   │   │   ├── AdjustmentRequest.java
    │   │   │   │   └── AdjustmentResponse.java
    │   │   │   ├── entity/
    │   │   │   │   └── InventoryAdjustment.java
    │   │   │   ├── repository/
    │   │   │   │   └── InventoryAdjustmentRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── InventoryService.java
    │   │   │   │   └── InventoryServiceImpl.java
    │   │   │   └── mapper/
    │   │   │       └── InventoryMapper.java
    │   │   │
    │   │   ├── order/                               # Module bán hàng
    │   │   │   ├── controller/
    │   │   │   │   └── OrderController.java         # /api/v1/orders
    │   │   │   ├── dto/
    │   │   │   │   ├── CreateOrderRequest.java
    │   │   │   │   ├── OrderItemRequest.java
    │   │   │   │   ├── OrderResponse.java
    │   │   │   │   └── OrderSummaryResponse.java
    │   │   │   ├── entity/
    │   │   │   │   ├── Order.java
    │   │   │   │   └── OrderItem.java
    │   │   │   ├── repository/
    │   │   │   │   ├── OrderRepository.java
    │   │   │   │   └── OrderItemRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── OrderService.java
    │   │   │   │   └── OrderServiceImpl.java        # Gọi InventoryService để trừ stock
    │   │   │   └── mapper/
    │   │   │       └── OrderMapper.java
    │   │   │
    │   │   ├── payment/                             # Module thanh toán
    │   │   │   ├── controller/
    │   │   │   │   └── PaymentController.java       # /api/v1/payments
    │   │   │   ├── dto/
    │   │   │   │   ├── CreatePaymentRequest.java
    │   │   │   │   └── PaymentResponse.java
    │   │   │   ├── entity/
    │   │   │   │   └── Payment.java
    │   │   │   ├── repository/
    │   │   │   │   └── PaymentRepository.java
    │   │   │   ├── service/
    │   │   │   │   ├── PaymentService.java
    │   │   │   │   └── PaymentServiceImpl.java
    │   │   │   └── mapper/
    │   │   │       └── PaymentMapper.java
    │   │   │
    │   │   └── report/                              # Module báo cáo (no entity)
    │   │       ├── controller/
    │   │       │   └── ReportController.java        # /api/v1/reports
    │   │       ├── dto/
    │   │       │   ├── RevenueReportResponse.java
    │   │       │   ├── RevenueDataPoint.java
    │   │       │   ├── TopProductResponse.java
    │   │       │   └── InventorySummaryResponse.java
    │   │       └── service/
    │   │           ├── ReportService.java
    │   │           ├── ReportServiceImpl.java       # JPQL / native query aggregate
    │   │           └── ReportExportService.java     # Xuất Excel/CSV/PDF
    │   │
    │   └── resources/
    │       ├── application.yml                      # Config gốc (không chứa secret)
    │       ├── application-dev.yml                  # Override cho môi trường dev
    │       ├── application-prod.yml                 # Override cho môi trường prod
    │       └── db/
    │           └── migration/                       # Flyway migrations (đặt tên V{n}__{desc}.sql)
    │               ├── V1__create_users.sql
    │               ├── V2__create_refresh_tokens.sql
    │               ├── V3__create_categories.sql
    │               ├── V4__create_products.sql
    │               ├── V5__create_inventory_adjustments.sql
    │               ├── V6__create_orders.sql
    │               ├── V7__create_order_items.sql
    │               ├── V8__create_payments.sql
    │               └── V9__seed_data.sql            # Dữ liệu mẫu (chỉ dùng dev)
    │
    └── test/
        └── java/com/pos/
            ├── auth/
            │   └── AuthServiceTest.java
            ├── product/
            │   ├── ProductServiceTest.java
            │   └── ProductControllerTest.java       # @WebMvcTest
            ├── inventory/
            │   └── InventoryServiceTest.java
            ├── order/
            │   └── OrderServiceTest.java
            ├── report/
            │   └── ReportServiceTest.java
            └── integration/
                └── OrderFlowIntegrationTest.java    # Testcontainers + MySQL
```

---

## Quy tắc đặt tên & Convention

### Package
```
com.pos.{module}.{layer}
# Ví dụ:
com.pos.product.controller.ProductController
com.pos.product.service.ProductServiceImpl
com.pos.product.repository.ProductRepository
```

### Mỗi module gồm đúng 5 layer:

```
controller  →  Nhận request, validate DTO, trả response
service     →  Xử lý business logic (interface + impl)
repository  →  Truy vấn DB (extends JpaRepository)
entity      →  Ánh xạ bảng DB (@Entity)
mapper      →  Chuyển đổi Entity ↔ DTO (MapStruct)
```

### Không được:
- Controller gọi trực tiếp Repository (phải qua Service).
- Entity expose ra ngoài API (phải qua DTO).
- Service của module này gọi Repository của module khác (phải gọi qua Service).

---

## Các file config quan trọng

### `application.yml`
```yaml
spring:
  application:
    name: pos-backend

  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/pos_db?useSSL=false&serverTimezone=UTC}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: validate          # Flyway quản lý schema, JPA chỉ validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQL8Dialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

server:
  port: ${PORT:8080}
  servlet:
    context-path: /api/v1

jwt:
  secret: ${JWT_SECRET}           # Bắt buộc set qua env
  access-token-expiry: 3600       # 1 giờ (giây)
  refresh-token-expiry: 604800    # 7 ngày (giây)

logging:
  level:
    com.pos: INFO
    org.hibernate.SQL: DEBUG      # Chỉ bật khi cần debug query
```

### `.env.example`
```env
DB_URL=jdbc:mysql://localhost:3306/pos_db?useSSL=false&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_key_at_least_256_bits
PORT=8080
```

---

## Base Entity (dùng chung)

```java
// common/entity/BaseEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

---

## API Response chuẩn

```java
// common/dto/ApiResponse.java
@Getter
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().success(true).data(data).message(message).build();
    }

    public static ApiResponse<Void> error(String message) {
        return ApiResponse.<Void>builder().success(false).message(message).build();
    }
}
```

---

## Global Exception Handler

```java
// common/exception/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.<Map<String, String>>builder()
                .success(false).message("Validation failed").data(errors).build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("Bạn không có quyền thực hiện hành động này."));
    }
}
```

---

## Dependency chính trong `pom.xml`

```xml
<!-- Spring Boot Starters -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-validation</dependency>

<!-- Database -->
<dependency>mysql-connector-j</dependency>
<dependency>flyway-mysql</dependency>

<!-- JWT -->
<dependency>jjwt-api (io.jsonwebtoken) 0.12.x</dependency>
<dependency>jjwt-impl</dependency>
<dependency>jjwt-jackson</dependency>

<!-- DTO Mapping -->
<dependency>mapstruct 1.5.x</dependency>
<dependency>lombok-mapstruct-binding</dependency>
<dependency>lombok</dependency>

<!-- API Docs -->
<dependency>springdoc-openapi-starter-webmvc-ui 2.x</dependency>

<!-- Export file -->
<dependency>apache-poi (xlsx)</dependency>
<dependency>opencsv (csv)</dependency>

<!-- Test -->
<dependency>spring-boot-starter-test</dependency>
<dependency>testcontainers (mysql, junit5)</dependency>
```

---

## Flyway migration mẫu

```sql
-- V1__create_users.sql
CREATE TABLE users (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name    VARCHAR(100),
    role         ENUM('ADMIN','MANAGER','CASHIER') NOT NULL DEFAULT 'CASHIER',
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V4__create_products.sql
CREATE TABLE products (
    id           VARCHAR(36)    NOT NULL PRIMARY KEY,
    category_id  VARCHAR(36),
    sku          VARCHAR(50)    NOT NULL UNIQUE,
    barcode      VARCHAR(100)   UNIQUE,
    name         VARCHAR(255)   NOT NULL,
    description  TEXT,
    price        DECIMAL(15,2)  NOT NULL,
    cost         DECIMAL(15,2),
    stock        INT            NOT NULL DEFAULT 0,
    threshold    INT            NOT NULL DEFAULT 10,
    unit         VARCHAR(50),
    image_url    VARCHAR(512),
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_product_sku (sku),
    INDEX idx_product_category (category_id),
    INDEX idx_product_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V6__create_orders.sql
CREATE TABLE orders (
    id           VARCHAR(36)    NOT NULL PRIMARY KEY,
    order_code   VARCHAR(30)    NOT NULL UNIQUE,
    cashier_id   VARCHAR(36),
    status       ENUM('PENDING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    subtotal     DECIMAL(15,2)  NOT NULL,
    discount     DECIMAL(15,2)  NOT NULL DEFAULT 0,
    total        DECIMAL(15,2)  NOT NULL,
    note         TEXT,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
