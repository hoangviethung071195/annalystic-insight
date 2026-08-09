# Kiến Thức Dự Án: Facebook Group Comments Crawler & Analyzer

Dự án này là hệ thống cục bộ (Local Tool) thu thập dữ liệu bình luận từ các nhóm Facebook mà tài khoản người dùng đã tham gia, sau đó phân tích nhu cầu và xu hướng của người dùng bằng AI (Gemini API).

---

## 1. Kiến Trúc Hệ Thống (Architecture)

* **Tầng Giao Diện (Frontend)**: Nuxt 3 SPA (Vue 3 + TypeScript + Vanilla CSS). Cung cấp giao diện trực quan để quản lý các nhóm, kích hoạt crawler, hiển thị dữ liệu bình luận, và hiển thị biểu đồ phân tích xu hướng/nhu cầu của AI.
* **Tầng Điều Phối & Crawler (Backend)**: NestJS (Node.js). Điều phối tiến trình crawl dữ liệu qua Apify/Playwright, gọi API của AI để phân tích dữ liệu, và giao tiếp với PostgreSQL/SQLite Database qua Prisma.
* **Tầng Thu Thập Dữ Liệu (Crawler Engine)**: Apify Actor / Playwright.
* **Tầng Cơ Sở Dữ Liệu (Database)**: PostgreSQL / SQLite. Lưu trữ thông tin nhóm, bài viết, bình luận và kết quả phân tích AI qua Prisma ORM.

---

## 2. Quyết Định Công Nghệ

| Thành phần | Công nghệ lựa chọn | Ghi chú |
| :--- | :--- | :--- |
| **Backend** | NestJS / Node.js | Mạnh mẽ, modular, kiến trúc SOLID, tích hợp Prisma |
| **Database** | PostgreSQL / SQLite | Sử dụng Prisma ORM để quản lý migrations và truy vấn |
| **Crawler** | Apify Facebook Scraper / Playwright | Thu thập dữ liệu ổn định tránh bị checkpoint |
| **Frontend** | Nuxt 3 (Vue 3, TS, Vanilla CSS) | SSR/SPA mượt mà, cấu trúc rõ ràng, tối ưu responsive |
| **AI Model** | Gemini 2.0/2.5 hoặc DeepSeek | Phân tích qua API Key cấu hình cục bộ |


---

## 3. Quy Trình Vận Hành Của Crawler

1. **Khởi Chạy Session**: Backend khởi chạy trình duyệt Chromium với một thư mục profile chỉ định (`user_data_dir`). Nếu người dùng chưa đăng nhập, trình duyệt hiển thị để người dùng đăng nhập thủ công trên facebook.com.
2. **Quét Nhóm**: Người dùng cung cấp URL của nhóm (ví dụ: `https://www.facebook.com/groups/xxxxx`).
3. **Cuộn & Thu Thập**:
   - Trình duyệt điều hướng tới URL nhóm.
   - Thực hiện cuộn trang xuống dưới để tải thêm bài viết (tùy chỉnh số lượng bài viết cần quét).
   - Với mỗi bài viết, tìm các nút hiển thị thêm bình luận (ví dụ: "Xem thêm bình luận", "Xem các bình luận trước", "Xem câu trả lời") và click để mở rộng tối đa.
   - Trích xuất nội dung: ID bài viết, Tên người đăng, Nội dung bài viết, ID bình luận, Tên người bình luận, Nội dung bình luận.
4. **Lưu trữ**: Đẩy dữ liệu thô vào SQLite.

---

## 4. Danh Mục Bảng Cơ Sở Dữ Liệu (SQLite Schema)

* **groups**:
  - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
  - `name` (TEXT)
  - `url` (TEXT, UNIQUE)
  - `last_crawled_at` (TEXT)

* **posts**:
  - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
  - `group_id` (INTEGER, REFERENCES groups(id))
  - `fb_post_id` (TEXT, UNIQUE)
  - `author_name` (TEXT)
  - `post_text` (TEXT)
  - `post_url` (TEXT)
  - `crawled_at` (TEXT)

* **comments**:
  - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
  - `post_id` (INTEGER, REFERENCES posts(id))
  - `fb_comment_id` (TEXT, UNIQUE)
  - `author_name` (TEXT)
  - `comment_text` (TEXT)
  - `created_at` (TEXT)

* **analysis_results**:
  - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
  - `group_id` (INTEGER, REFERENCES groups(id))
  - `analysis_text` (TEXT) -- Báo cáo JSON hoặc Markdown chứa phân tích xu hướng
  - `created_at` (TEXT)
