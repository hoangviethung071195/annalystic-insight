# Hướng dẫn Kiểm thử: Electron Desktop Crawler & Prisma PostgreSQL

Hệ thống đã được chuyển đổi để hỗ trợ chạy Playwright trực tiếp dưới client bằng Electron và tích hợp cơ sở dữ liệu PostgreSQL (qua Prisma ORM) cho Backend để sẵn sàng triển khai lên GCP.

---

## 1. Các phần đã thay đổi

### Phía Client (Electron + Nuxt 3)
* **[NEW] [main.cjs](file:///c:/work/du-an-rieng/crawl-website/apps/fe/main.cjs):** Chứa logic cào bằng Playwright, mở trình duyệt headed để người dùng tự đăng nhập và giải checkpoint, sau đó gửi dữ liệu bài viết về Backend qua HTTP POST API.
* **[NEW] [preload.cjs](file:///c:/work/du-an-rieng/crawl-website/apps/fe/preload.cjs):** Cầu nối IPC từ Nuxt UI sang Electron Main Process.
* **[MODIFY] [useApi.ts](file:///c:/work/du-an-rieng/crawl-website/apps/fe/composables/useApi.ts):** Tự động phát hiện môi trường chạy để chuyển hướng các API cào qua Electron IPC.

### Phía Backend (NestJS + Prisma PostgreSQL)
* **[NEW] [schema.prisma](file:///c:/work/du-an-rieng/crawl-website/apps/be/prisma/schema.prisma):** Định nghĩa cấu trúc các bảng Groups, Posts, Comments, AnalysisResults tương thích PostgreSQL.
* **[NEW] [prisma.service.ts](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/db/prisma.service.ts):** Dịch vụ kết nối database Prisma.
* **[MODIFY] [database.module.ts](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/db/database.module.ts):** Khai báo và export `PrismaService` toàn cục.
* **[MODIFY] Các dịch vụ Backend:** Chuyển đổi từ SQLite (`DatabaseService`) sang Prisma ORM:
  * [GroupsService](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/groups/groups.service.ts)
  * [PostsService](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/posts/posts.service.ts)
  * [CommentsService](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/comments/comments.service.ts)
  * [AnalysisService](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/analysis/analysis.service.ts)
* **[MODIFY] [app.module.ts](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/app.module.ts):** Comment out `CrawlerModule` để đóng băng phần cào cũ ở Backend (không chạy trên server GCP).
* **[MODIFY] [crawler.service.ts](file:///c:/work/du-an-rieng/crawl-website/apps/be/src/crawler/crawler.service.ts):** Cập nhật thêm `await` cho các lệnh gọi service để đảm bảo code cũ không bị lỗi biên dịch TypeScript.

---

## 2. Hướng dẫn chạy thử nghiệm dưới local (PostgreSQL)

### Bước 1: Cấu hình Environment
Mở tệp cấu hình `.env` của Backend (`apps/be/.env`) và thêm biến kết nối database PostgreSQL (ví dụ lấy chuỗi kết nối từ Neon Tech):
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-cold-scene.ap-southeast-1.aws.neon.tech/bizmind_db?sslmode=require"
```

### Bước 2: Tạo các bảng trên PostgreSQL (Migration)
Tại thư mục `apps/be`, chạy lệnh tạo bảng:
```bash
npx prisma db push
```

### Bước 3: Khởi chạy dự án dưới local
1. **Chạy Backend:**
   ```bash
   cd apps/be
   npm run dev
   ```
2. **Chạy Frontend (Nuxt dev server):**
   ```bash
   cd apps/fe
   pnpm dev
   ```
3. **Chạy Electron App:**
   ```bash
   cd apps/fe
   pnpm electron:dev
   ```
