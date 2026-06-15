# AGENTS.md

Tài liệu hướng dẫn dành cho AI agent và lập trình viên khi làm việc trong repo này.
Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.

---

## Tổng quan dự án

Đây là **monorepo** cho hệ thống **POS (Point of Sale)**. Repo được chia thành 3 phần chính:

| Thư mục     | Công nghệ      | Vai trò                                      |
|-------------|----------------|----------------------------------------------|
| `backend/`  | Spring Boot    | REST API, business logic, truy cập database  |
| `frontend/` | React JS       | Giao diện người dùng, tích hợp API           |
| `docs/`     | Markdown       | Tài liệu thiết kế, API, ERD, triển khai      |

---

## Nguyên tắc chung

- **Thay đổi nhỏ gọn, đúng phạm vi** — không sửa những gì không liên quan đến yêu cầu hiện tại.
- **Backend và frontend tách biệt** — không để logic nghiệp vụ rò rỉ sang frontend và ngược lại.
- **Cập nhật tài liệu** — nếu thêm hoặc sửa API/entity/kiến trúc, cập nhật file tương ứng trong `docs/`.
- **Scaffold tối thiểu trước** — nếu framework chưa được khởi tạo, chỉ tạo cấu trúc cần thiết, không thêm code thừa.

---

## Cấu trúc thư mục

### Backend (`backend/`)

```
backend/
└── src/
    └── main/
        ├── java/
        │   └── com/<package>/
        │       ├── controller/      # REST controllers (@RestController)
        │       ├── service/         # Business logic (@Service)
        │       ├── repository/      # Truy cập database (Spring Data JPA)
        │       ├── entity/          # JPA entities (@Entity)
        │       ├── dto/             # Data Transfer Objects (request/response)
        │       ├── exception/       # Custom exceptions & global handler
        │       └── config/          # Spring configuration (Security, CORS, v.v.)
        └── resources/
            ├── application.yml      # Cấu hình môi trường
            └── db/migration/        # Flyway/Liquibase scripts (nếu có)
```

**Quy ước:**
- Mỗi tính năng nghiệp vụ có controller, service, repository riêng — không gộp chung.
- DTO tách riêng khỏi entity — không trả entity trực tiếp ra ngoài API.
- Đặt tên theo chuẩn: `ProductController`, `ProductService`, `ProductRepository`, `ProductEntity`.

### Frontend (`frontend/`)

```
frontend/
└── src/
    ├── components/     # UI components tái sử dụng (Button, Modal, Table, v.v.)
    ├── pages/          # Các trang chính, ánh xạ theo route
    ├── layouts/        # Layout wrapper (sidebar, header, auth layout)
    ├── services/       # Gọi API (axios/fetch), không để trực tiếp trong component
    ├── hooks/          # Custom React hooks
    ├── stores/         # State management (nếu dùng Zustand/Redux)
    ├── assets/         # Hình ảnh, icon, font
    └── utils/          # Hàm tiện ích thuần túy
```

**Quy ước:**
- Gọi API chỉ trong `services/` hoặc custom hook — không gọi trực tiếp trong component.
- Component trong `components/` phải độc lập, không phụ thuộc business logic.
- Mỗi page nằm trong một folder riêng nếu có nhiều file liên quan.

---

## Tài liệu (`docs/`)

| File                    | Nội dung                                             |
|-------------------------|------------------------------------------------------|
| `docs/api.md`           | Mô tả các endpoint REST: method, path, request/response, auth |
| `docs/architecture.md`  | Kiến trúc tổng quan: các layer, luồng dữ liệu, sơ đồ hệ thống |
| `docs/database.md`      | Schema database, mô tả entity và quan hệ (ERD)      |

**Khi nào cần cập nhật docs:**
- Thêm hoặc thay đổi endpoint → cập nhật `api.md`
- Thay đổi entity hoặc bảng database → cập nhật `database.md`
- Thay đổi kiến trúc tổng thể → cập nhật `architecture.md`

---

## Hướng dẫn cho AI Agent

### Trước khi chỉnh sửa

1. Xác định rõ yêu cầu thuộc `backend/`, `frontend/`, hay `docs/`.
2. Đọc file liên quan trước khi viết code mới để tránh trùng lặp.
3. Nếu chưa rõ cấu trúc hiện tại, liệt kê file trong thư mục trước.

### Khi tạo file mới

- Đặt file đúng thư mục chức năng theo cấu trúc ở trên.
- Đặt tên file theo chuẩn của từng layer (`*Controller.java`, `*Service.java`, `use*.ts`, v.v.).
- Không tạo file ngoài cấu trúc đã định trừ khi có lý do rõ ràng.

### Khi sửa file hiện có

- Không xóa code đang hoạt động nếu yêu cầu không đề cập.
- Không đổi tên method/class công khai nếu chưa kiểm tra toàn bộ nơi dùng.
- Giữ nguyên style code hiện tại (indent, naming, format) trong file đó.

### Những việc KHÔNG làm

- ❌ Không thêm dependency mới vào `pom.xml` / `package.json` nếu không được yêu cầu.
- ❌ Không thay đổi cấu hình môi trường (`application.yml`, `.env`) nếu không được yêu cầu.
- ❌ Không refactor code ngoài phạm vi của yêu cầu.
- ❌ Không tự ý chọn thư viện thay thế mà không hỏi trước.

---

## Liên hệ & Ghi chú bổ sung

- Nếu có câu hỏi về nghiệp vụ POS, tham khảo `docs/architecture.md` trước.
- Các quyết định thiết kế lớn nên được ghi chú lại trong `docs/` để các agent sau không làm lại.