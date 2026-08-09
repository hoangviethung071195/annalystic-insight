# Backend & Flutter API Contract

Tài liệu này mô tả các endpoint trong NestJS Backend mà ứng dụng Flutter sẽ sử dụng để tương tác với hệ thống AI và quản trị dữ liệu.

---

## 1. Chat & Query Endpoint (AI Chatbot)

Dùng để gửi câu hỏi từ người dùng tới AI để lấy stream câu trả lời (RAG).

* **URL**: `/chat/ask`
* **Method**: `POST`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer [JWT_TOKEN]` (Nếu áp dụng bảo mật)
* **Payload**:
  ```json
  {
    "chatInput": "Doanh thu tháng 4 là bao nhiêu?",
    "department": "products"
  }
  ```
* **Response (Streaming)**:
  * Content-Type: `text/plain; charset=utf-8`
  * Transfer-Encoding: `chunked`
  * Nội dung: Trả về chuỗi text trực tiếp dạng chunk từ LLM.

---

## 2. Quản Trị Sản Phẩm (Products CRUD & Phân trang)

Dùng để hiển thị, thêm, sửa, xóa sản phẩm trong hệ thống dữ liệu tự thân.

### A. Lấy danh sách sản phẩm (có bộ lọc và phân trang)
* **URL**: `/products`
* **Method**: `GET`
* **Query Parameters**:
  * `search` (tùy chọn): Từ khóa tìm kiếm theo tên hoặc mã sản phẩm.
  * `category` (tùy chọn): Lọc theo danh mục.
  * `brand` (tùy chọn): Lọc theo thương hiệu.
  * `page` (tùy chọn, mặc định: "1"): Trang cần hiển thị.
  * `limit` (tùy chọn, mặc định: "10"): Số lượng sản phẩm mỗi trang.
* **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid-string",
        "code": "420068",
        "name": "Bàn chải điện Philips Sonicare HX3671/23 màu trắng",
        "category": "Gia dụng",
        "brand": "Philips",
        "price": 1690000,
        "currency": "VNĐ",
        "stock": 10,
        "features": "Đặc điểm nổi bật...",
        "specifications": "Thông số...",
        "warranty": "24 tháng",
        "madeIn": "Trung Quốc",
        "imageUrl": "https://..."
      }
    ],
    "meta": {
      "total": 7942,
      "page": 1,
      "limit": 10,
      "totalPages": 795
    }
  }
  ```

### B. Lấy chi tiết sản phẩm
* **URL**: `/products/:id`
* **Method**: `GET`
* **Response**: Dữ liệu chi tiết của 1 sản phẩm.

### C. Tạo sản phẩm mới
* **URL**: `/products`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "code": "NEW-SKU",
    "name": "Tên sản phẩm",
    "category": "Danh mục",
    "brand": "Thương hiệu",
    "price": 100000,
    "features": "Đặc điểm...",
    "specifications": "Thông số...",
    "warranty": "12 tháng",
    "madeIn": "Đức"
  }
  ```

### D. Cập nhật sản phẩm
* **URL**: `/products/:id`
* **Method**: `PUT`
* **Payload**: Các trường cần cập nhật (Partial update).

### E. Xóa sản phẩm
* **URL**: `/products/:id`
* **Method**: `DELETE`

---

## 3. Kích Hoạt Đồng Bộ Hóa Vector Embedding (Sync Trigger)

Dùng khi quản trị viên nhấn nút "Đồng bộ dữ liệu" trên giao diện Admin/Skill Builder để sinh vector embedding cho các sản phẩm trong database.

* **URL**: `/sync/trigger`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "sheetName": "products", // Tùy chọn (để tương thích ngược)
    "mode": "incremental"   // "full" (xóa hết sinh lại từ đầu) hoặc "incremental" (chỉ sinh các sản phẩm thiếu vector)
  }
  ```
* **Response**:
  ```json
  {
    "status": "success",
    "message": "Đồng bộ thành công 5 sản phẩm.",
    "sheetName": "products",
    "recordCount": 5,
    "durationMs": 4200
  }
  ```
