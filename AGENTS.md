# AGENTS.md

Hướng dẫn nhanh cho AI agent và lập trình viên khi làm việc trong repo này.

## Mục tiêu repo

Đây là monorepo cho hệ thống POS gồm:

- `backend/`: ứng dụng Spring Boot, REST API, business logic, database access.
- `frontend/`: ứng dụng React JS, giao diện người dùng và tích hợp API.
- `docs/`: tài liệu thiết kế hệ thống, API, ERD, ghi chú triển khai.

## Nguyên tắc làm việc

- Giữ thay đổi nhỏ gọn, đúng phạm vi yêu cầu.
- Không sửa các phần không liên quan nếu chưa cần thiết.
- Ưu tiên giữ backend và frontend tách biệt rõ ràng.
- Khi thêm tính năng mới, cập nhật tài liệu trong `docs/` nếu phù hợp.

## Quy ước cấu trúc đề xuất

### Backend

Spring Boot nên được tổ chức theo hướng:

- `src/main/java/.../controller`
- `src/main/java/.../service`
- `src/main/java/.../repository`
- `src/main/java/.../entity`
- `src/main/resources`

### Frontend

React nên được tổ chức theo hướng:

- `src/components`
- `src/pages`
- `src/services`
- `src/hooks`
- `src/layouts`
- `src/assets`

## Quy ước tài liệu

- `docs/api.md`: mô tả API.
- `docs/architecture.md`: mô tả kiến trúc tổng quan.
- `docs/database.md`: mô tả database và entity chính.

## Khi AI agent chỉnh sửa

- Tôn trọng cấu trúc monorepo hiện tại.
- Nếu tạo file mới, đặt đúng thư mục chức năng.
- Nếu chưa có framework được khởi tạo, chỉ tạo scaffold tối thiểu trước.
