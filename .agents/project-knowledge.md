# Kiến Thức Dự Án: Bizmind AI (Modular & Self-Contained RAG System)

> [!IMPORTANT]
> Cập nhật kiến trúc 2026-05-17: Loại bỏ hoàn toàn **n8n**, **Google Sheets**, và **Pinecone** để chuyển đổi sang kiến trúc **RAG tự thân tối giản (Self-Contained RAG)** sử dụng **NestJS Backend + PostgreSQL (pgvector) + Flutter Frontend**.

---

## 1. Kiến Trúc Hệ Thống Tổng Thể (Self-Contained Architecture)

Hệ thống được xây dựng theo mô hình Enterprise RAG khép kín và độc lập 100% nhằm đạt hiệu năng tối đa, bảo mật tuyệt đối và cập nhật thời gian thực (Real-time 100%):

* **Tầng Giao Diện (Frontend)**: Flutter App (Web & Mobile) đóng vai trò làm giao diện chat với khách hàng (Chat Interface) kiêm cổng thông tin quản trị sản phẩm cho Admin (Admin Portal).
* **Tầng Điều Hành (AI Orchestrator)**: NestJS Backend (`/be`) thực hiện toàn bộ logic nghiệp vụ, quản lý phân quyền (RBAC), tự động gọi API sinh Vector Embedding và điều phối luồng RAG.
* **Tầng Cơ Sở Dữ Liệu Hợp Nhất (Unified Database)**: PostgreSQL tích hợp extension `pgvector` đóng vai trò là **Single Source of Truth** duy nhất lưu trữ đồng thời cả dữ liệu có cấu trúc (sản phẩm, giá, tồn kho) và Vector Embedding 1536 chiều.

---

## 2. Quyết Định Công Nghệ

| Thành phần | Công nghệ lựa chọn | Ghi chú |
| :--- | :--- | :--- |
| **Backend** | NestJS | AI Orchestrator, REST APIs, Streaming Response |
| **ORM** | Prisma ORM | Tương tác cơ sở dữ liệu trực quan bằng TypeScript |
| **Database** | PostgreSQL + `pgvector` | Hợp nhất cả Database thường và Vector DB làm một |
| **Frontend** | Flutter | Đa nền tảng (Web & Mobile), Dashboard & Chat UI |
| **AI Model** | DeepSeek / Ollama | Linh hoạt chuyển đổi model qua lớp AIModel (SOLID) |
| **Embedding Model** | OpenAI `text-embedding-3-small` | Sinh vector 1536 chiều chất lượng cao |

---

## 3. Giải Pháp Chi Tiết Theo 3 Trụ Cột

### A. Quản Trị Dữ Liệu Tự Thân & Tự Động Sinh Embedding
* **Thêm/Sửa sản phẩm**: Thực hiện trực tiếp trên Flutter Admin Portal gửi tới API NestJS Backend.
* **Tự động hóa Vector**: NestJS Backend khi nhận sản phẩm sẽ tự động gộp các cột ngữ nghĩa (`Tên sản phẩm` + `Danh mục` + `Thương hiệu` + `Đặc điểm`) để gọi OpenAI API tạo chuỗi Vector Embedding 1536 chiều, sau đó lưu trực tiếp vào cột `embedding` trong PostgreSQL chỉ bằng 1 câu lệnh duy nhất của Prisma.

### B. AI Chatbot & Bộ Lọc Động Real-time (Structured RAG)
* **Trích xuất bộ lọc**: Khi nhận câu hỏi của người dùng, NestJS Backend dùng một model AI siêu nhẹ (như `gpt-4o-mini` hoặc `qwen2.5:7b` local) để phân tích ý định (Intent Parsing) và trích xuất bộ lọc (ví dụ: `price <= 2000000`, `brand = "Bohemia"`).
* **Query SQL lai ghép**: Backend truy vấn PostgreSQL thực hiện so khớp vector tương đồng ngữ nghĩa kết hợp lọc cứng 100% bằng SQL (`price`, `brand`, `stock > 0`), loại bỏ triệt để các sản phẩm hết hàng hoặc sai giá trước khi trả kết quả cho LLM sinh câu trả lời.

### C. Giao Diện & Tương Tác (The Interface)
* **Chat Interface**: Giao diện chat thời gian thực hỗ trợ stream đáp án của AI (trả lời đến đâu chữ chạy đến đó).
* **Product Card rendering**: Khi metadata trả về có chứa link ảnh sản phẩm, Flutter render thẻ sản phẩm trực quan sinh động bên cạnh câu trả lời của AI.
* **Admin Portal**: Màn hình CRUD danh sách sản phẩm giúp nhân viên cập nhật tồn kho, giá cả thời gian thực mượt mà.

---

## 4. Danh Mục Tính Năng & Vị Trí Code (Feature Directory)

Để phục vụ phát triển tiếp nối và kiểm thử, dưới đây là danh sách các tính năng hiện tại của dự án kèm vị trí file code tương ứng và cách kiểm tra:

### A. Structured RAG Product Search ( pgvector + SQL Hybrid )
* **Mô tả**: Sinh embedding cho câu hỏi, trích xuất bộ lọc thương hiệu/giá bằng AI, tìm kiếm sản phẩm kết hợp cosine similarity của Postgres pgvector và lọc cứng SQL, sau đó đưa ngữ cảnh vào LLM để stream câu trả lời.
* **File chính**:
  - Backend Service: [chat.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/chat/chat.service.ts) (Hàm `handleProductInquiry`)
  - Embedding Generator: [embedding.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/embedding/embedding.service.ts)
* **Quy trình kiểm tra**:
  - Gửi POST request dạng JSON tới `/chat/ask` với câu hỏi dạng hỏi sản phẩm (ví dụ: `"Có bếp từ Bosch không?"`).
  - Kiểm tra xem kết quả stream trả về có chứa thông tin sản phẩm và giá cả chính xác từ DB không.

### B. Facebook Messenger Webhook & Auto-Reply
* **Mô tả**: Webhook nhận tin nhắn Messenger từ khách hàng, lưu lịch sử trò chuyện, phân tích ý định, gửi phản hồi tự động nếu bật `ai_auto_reply_enabled` qua Facebook Send API bằng các Prompt tĩnh cứng bảo mật ở BE.
* **File chính**:
  - Controller: [facebook.controller.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/facebook/facebook.controller.ts)
  - Service: [facebook.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/facebook/facebook.service.ts)
* **Quy trình kiểm tra**:
  - Xác thực webhook: Gửi GET request tới `/facebook/webhook` kèm các query params `hub.mode=subscribe`, `hub.verify_token=bizmind_messenger_verify_token`, và `hub.challenge=test`. Server phải trả về chuỗi `test`.
  - Nhận tin nhắn: Gửi POST request tới `/facebook/webhook` chứa payload mô phỏng tin nhắn từ khách hàng. Xác nhận tin nhắn được ghi nhận vào bảng `FacebookChatMessage` trong Database.

### C. Real-time Web Notifications ( WebSocket )
* **Mô tả**: Khi chatbot nhận diện được ý định khẩn cấp (như khách cần hỗ trợ trực tiếp `HUMAN_ASSISTANCE` hoặc muốn đặt hàng `ORDER_CREATE`), hệ thống sẽ tạo bản ghi thông báo trong DB và broadcast sự kiện thời gian thực qua WebSockets đến Dashboard Admin.
* **File chính**:
  - Backend WebSocket Gateway: [notification.gateway.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/notification/notification.gateway.ts)
  - Backend Service: [notification.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/notification/notification.service.ts)
  - Frontend Service: [notification_service.dart](file:///c:/work/tuan/bizmind-ai/apps/fe/lib/service/notification_service.dart)
  - Frontend Dialog: [notification_dialog.dart](file:///c:/work/tuan/bizmind-ai/apps/fe/lib/component/notification_dialog.dart)
* **Quy trình kiểm tra**:
  - Gửi một tin nhắn yêu cầu hỗ trợ (ví dụ: `"tôi muốn gặp nhân viên trực chat"`) đến `/chat/ask`.
  - Xác nhận rằng bản ghi thông báo mới được tạo trong bảng `Notification` và cổng WebSocket phát đi sự kiện broadcast thành công.

### D. Hệ thống cấu hình Settings động ( DB-backed Settings )
* **Mô tả**: Quản lý các cấu hình hệ thống (bật tắt AI Auto-reply, tên công ty, prompt của phòng ban) thông qua Database, cho phép Admin cập nhật và áp dụng ngay lập tức mà không cần restart server.
* **File chính**:
  - Backend Service: [settings.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/settings/settings.service.ts)
  - Backend Controller: [settings.controller.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/settings/settings.controller.ts)
  - Frontend Page: [settings_page.dart](file:///c:/work/tuan/bizmind-ai/apps/fe/lib/page/settings_page.dart)
* **Quy trình kiểm tra**:
  - Kiểm tra API GET `/settings` xem có trả về đúng map key-value của cấu hình hiện tại.
  - Sử dụng API PATCH `/settings` hoặc giao diện Admin để cập nhật một tham số (như `company_name`) và xác nhận giá trị mới được nạp thành công ở câu trả lời tiếp theo của chatbot.

### E. Quản trị sản phẩm & Phân trang ( Flutter CRUD + Pagination )
* **Mô tả**: Màn hình hiển thị danh sách sản phẩm dưới dạng DataTable, hỗ trợ tìm kiếm, lọc và phân trang động từ API. Đảm bảo giao diện responsive co giãn tốt trên Desktop và cuộn mượt mà trên Mobile.
* **File chính**:
  - Frontend Page: [admin_product_page.dart](file:///c:/work/tuan/bizmind-ai/apps/fe/lib/page/admin_product_page.dart)
  - Backend Controller: [product.controller.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/product/product.controller.ts)
  - Backend Service: [product.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/product/product.service.ts)
* **Quy trình kiểm tra**:
  - Xem danh sách sản phẩm trên màn hình Desktop: Bảng phải tự động giãn rộng 100% không bị co cụm méo mó.
  - Xem danh sách trên màn hình Mobile: Bảng cho phép cuộn ngang, không bị tràn màn hình (không có dải sọc vàng cảnh báo Overflow).

### F. Đồng bộ hóa dữ liệu ( Data Synchronizer )
* **Mô tả**: Bấm nút đồng bộ trên giao diện để kích hoạt tiến trình đọc dữ liệu sản phẩm từ file Excel/Google Sheets, phân tích thuộc tính và upsert vào Postgres DB, đồng thời sinh embedding vector hàng loạt.
* **File chính**:
  - Backend Service: [sync.service.ts](file:///c:/work/tuan/bizmind-ai/apps/be/src/sync/sync.service.ts)
  - Frontend Page: [skill_builder_page.dart](file:///c:/work/tuan/bizmind-ai/apps/fe/lib/page/skill_builder_page.dart)
* **Quy trình kiểm tra**:
  - Bấm nút "Đồng bộ" trên trang Skill Builder.
  - Kiểm tra logs backend để xác minh tiến trình đọc files, sinh embedding và đẩy dữ liệu hoàn tất không bị timeout hay nghẽn bộ nhớ.

---

## 5. Tài Nguyên & Cấu Hình

* **Database URL**: `postgresql://postgres:postgres@localhost:5432/bizmind_ai?schema=public`
* **Prisma Schema Location**: `apps/be/prisma/schema.prisma`
* **OpenAI Embedding Model**: `text-embedding-3-small` (1536 dimensions)
* **Local Ollama Models**: `nomic-embed-text`, `qwen2.5:14b`
