# Đề Tài 10: Xây Dựng Backend API cho Hệ Thống POS và Quản Lý Tồn Kho

> **Môn học:** Back-End Development / Web Service / Java Enterprise  
> **Công nghệ:** Spring Boot 4, Spring Web, Spring Security, Spring Data JPA, PostgreSQL  
> **Năm biên soạn:** 2026

---

## 1. Giới Thiệu

Đề tài mô phỏng hệ thống điểm bán hàng (POS) kết hợp kho vận cho cửa hàng hoặc chuỗi chi nhánh. Backend phải hỗ trợ nhập hàng, bán hàng, điều chỉnh tồn kho, theo dõi chuyển động kho và sinh báo cáo doanh thu – chi phí – lợi nhuận trên cơ sở giao dịch đã phát sinh.

---

## 2. Mục Tiêu Đào Tạo

- Thiết kế dữ liệu cho sản phẩm, nhà cung cấp, phiếu nhập, hóa đơn bán, chuyển động kho và chi nhánh.
- Xây dựng API bán hàng nhanh cho nhân viên quầy và API nhập kho/điều chỉnh kho cho quản trị.
- Bảo đảm nhất quán tồn kho bằng **transaction** khi phát sinh giao dịch mua vào hoặc bán ra.
- Ghi nhận đầy đủ **audit log** cho các thao tác nhạy cảm như điều chỉnh tồn, xóa sản phẩm, xác nhận nhập hàng.
- Xây dựng báo cáo doanh thu, giá vốn và lợi nhuận theo khoảng thời gian.

---

## 3. Chuẩn Đầu Ra Mong Đợi

- Xây dựng được API cho: `product`, `supplier`, `sale`, `purchase`, `stock_movement`, `branch`, `audit_log`.
- Tổ chức được quyền truy cập theo **vai trò** và theo **chi nhánh** khi hệ thống hoạt động đa điểm bán.
- Viết được test cho: âm kho, nhập hàng, bán hàng đồng thời và phân quyền chi nhánh.

---

## 4. Phát Biểu Bài Toán

Hệ thống phải cho phép:

- **Nhân viên bán hàng:** tìm kiếm sản phẩm nhanh, thêm vào hóa đơn, xác nhận thanh toán và xuất hóa đơn.
- **Quản trị viên:** quản lý nhà cung cấp, nhập kho, điều chỉnh kho, phân quyền theo chi nhánh và truy xuất báo cáo lợi nhuận theo ngày/tuần/tháng.

---

## 5. Phạm Vi Chức Năng Nghiệp Vụ

| Nhóm | Chức năng |
|---|---|
| Nhân viên bán hàng | Tra cứu sản phẩm, kiểm tra tồn kho, tạo hóa đơn bán, hoàn tất giao dịch |
| Quản trị kho | Nhập kho, xác nhận phiếu nhập, điều chỉnh tồn, quản lý nhà cung cấp |
| Quản lý chi nhánh | CRUD chi nhánh, gán người dùng vào chi nhánh, giới hạn dữ liệu theo phạm vi |
| Báo cáo | Doanh thu, giá vốn, lợi nhuận, mặt hàng bán chạy, lịch sử chuyển động kho |

---

## 6. Yêu Cầu Thiết Kế Backend API

### 6.1 API Bán Hàng (Sale Transaction)
- Tạo hóa đơn, trừ tồn kho và ghi `stock_movement` loại `OUT` **trong cùng một transaction**.

### 6.2 API Nhập Hàng (Purchase/Receipt)
- Cập nhật tồn kho và ghi `stock_movement` loại `IN` **trong cùng một transaction**.

### 6.3 API Điều Chỉnh Tồn Kho
- Cho phép điều chỉnh tồn thủ công kèm **lý do** và **actor** thực hiện.
- Ghi nhận vào `audit_log` và `stock_movement`.

### 6.4 API Audit Log
- Ghi nhận đầy đủ các hành động quản trị quan trọng: xóa sản phẩm, xác nhận nhập hàng, chỉnh tồn.

### 6.5 API Báo Cáo *(Bonus)*
- Xuất báo cáo dạng **CSV** hoặc **XLSX** theo khoảng thời gian.

---

## 7. Yêu Cầu Cơ Sở Dữ Liệu

| Bảng | Mô tả |
|---|---|
| `products` | Mã hàng, tên hàng, đơn vị tính, giá bán, giá nhập, tồn kho hiện tại |
| `suppliers` | Thông tin đối tác cung ứng |
| `purchases` + `purchase_items` | Phiếu nhập hàng và chi tiết |
| `sales` + `sale_items` | Hóa đơn bán hàng và chi tiết |
| `stock_movements` | Mọi biến động nhập – xuất – điều chỉnh tồn để đối soát |
| `branches` | Các điểm bán hoặc kho hàng |
| `audit_logs` | actor, action, entity, timestamp và dữ liệu mô tả chi tiết |

---

## 8. Yêu Cầu Kỹ Thuật Bắt Buộc

- **Framework:** Spring Boot 4, Spring Web, Spring Security, Spring Data JPA
- **Database:** PostgreSQL
- **Validation:** Bean Validation cho request body, request param và path variable
- **Xử lý lỗi:** `@ControllerAdvice` với mã lỗi nghiệp vụ rõ ràng
- **Tài liệu API:** Swagger/OpenAPI hoặc Postman Collection
- **Kiểm thử:** JUnit, MockMvc hoặc Testcontainers
- **Khuyến nghị:** Flyway (migration), MapStruct + Lombok (DTO layer)

---

## 9. Sản Phẩm Bàn Giao

| # | Thành phần |
|---|---|
| 1 | Mã nguồn backend hoàn chỉnh, có cấu trúc package rõ ràng |
| 2 | ERD hoặc sơ đồ quan hệ dữ liệu |
| 3 | Swagger/OpenAPI hoặc Postman Collection |
| 4 | Bộ test API tối thiểu **8 trường hợp kiểm thử** chính |
| 5 | README hướng dẫn cài đặt, cấu hình biến môi trường và chạy dự án |

---

## 10. Tiêu Chí Đánh Giá

| Tiêu chí | Mô tả | Tỷ trọng |
|---|---|---|
| Phân tích nghiệp vụ | Hiểu đúng bài toán, xác định rõ actor và luồng xử lý | 15% |
| Thiết kế dữ liệu | Lược đồ chuẩn hóa, quan hệ chặt chẽ | 15% |
| Chất lượng API | Endpoint rõ ràng, phân trang, lọc, xử lý lỗi tốt | 20% |
| Bảo mật & phân quyền | JWT, Refresh Token, RBAC, giới hạn truy cập đúng vai trò | 15% |
| Kiểm thử & tài liệu | Test API, Swagger/Postman, README đầy đủ | 15% |
| Hoàn thiện kỹ thuật | Logging, validation, transaction, migration, triển khai ổn định | 20% |

---

## 11. Gợi Ý Triển Khai

> Ưu tiên hoàn thiện các API cốt lõi (bán hàng, nhập kho) trước, sau đó bổ sung validation nghiệp vụ, logging, Swagger và test.  
> Với các nghiệp vụ có nguy cơ xung đột dữ liệu **(âm kho, bán hàng đồng thời)**, cần thiết kế **transaction rõ ràng** và **kiểm thử đồng thời**.
