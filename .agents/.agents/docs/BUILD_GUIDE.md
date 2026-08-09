# Hướng dẫn Chạy Local & Build App Production (Windows & iOS)

Tài liệu này hướng dẫn chi tiết các bước để thiết lập chạy dự án trong môi trường phát triển (Local), build ứng dụng cho máy tính Windows (sử dụng Electron) và build ứng dụng di động iOS (sử dụng Capacitor).

---

## 1. Chạy Dự Án Trong Môi Trường Local

Hệ thống được chia làm hai phần: **Backend (NestJS)** và **Frontend (Nuxt 3)**.

### 1.1. Cấu hình file môi trường (.env)
Tại thư mục gốc của dự án (`crawl-website/`), tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```
Cấu hình các tham số cần thiết như `GEMINI_API_KEY`, cổng chạy (PORT) và đường dẫn dữ liệu.

---

### 1.2. Khởi chạy Backend (NestJS)
1. Di chuyển vào thư mục Backend:
   ```bash
   cd apps/be
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   # Hoặc nếu dùng pnpm:
   pnpm install
   ```
3. Chạy Server ở chế độ Development (tự động reload khi code thay đổi):
   ```bash
   npm run dev
   ```
   *Backend mặc định chạy tại: `http://localhost:3001`*

---

### 1.3. Khởi chạy Frontend (Nuxt 3)
1. Di chuyển vào thư mục Frontend:
   ```bash
   cd apps/fe
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   # Hoặc nếu dùng pnpm:
   pnpm install
   ```
3. Chạy Client ở chế độ Development:
   ```bash
   npm run dev
   ```
   *Frontend mặc định chạy tại: `http://localhost:3000`*

---

## 2. Tạo App Production cho Windows (Electron)

Frontend của ứng dụng đã được cấu hình tích hợp sẵn Electron để build thành phần mềm chạy trực tiếp trên Windows `.exe`.

### Các bước đóng gói:
1. Đảm bảo bạn đang ở thư mục Frontend:
   ```bash
   cd apps/fe
   ```
2. Chạy lệnh build tĩnh Nuxt và đóng gói qua Electron:
   ```bash
   npm run build
   ```
   *Lệnh này sẽ thực hiện:*
   - `nuxt generate`: Build Frontend thành các file HTML/CSS/JS tĩnh đặt trong thư mục `.output/public`.
   - `electron-builder`: Đóng gói ứng dụng thành file cài đặt `.exe` cho Windows dựa trên file cấu hình `electron-builder.json`.

3. Sau khi build hoàn tất, file cài đặt và ứng dụng chạy trực tiếp sẽ nằm ở thư mục:
   ```
   apps/fe/release/
   ```

---

## 3. Tạo App Production cho macOS (Electron)

Frontend của ứng dụng cũng hỗ trợ đóng gói thành định dạng `.dmg` hoặc `.app` chạy trên hệ điều hành macOS sử dụng Electron.

### 3.1. Yêu cầu hệ thống để build macOS
Để đảm bảo ứng dụng chạy mượt mà và không gặp lỗi biên dịch thư viện liên kết native (như Playwright), việc build bản macOS nên được thực hiện trên **máy tính chạy macOS**.

### 3.2. Nếu bạn KHÔNG CÓ máy Mac (Build macOS trên Windows)
Bạn vẫn có hai phương pháp để tạo file `.dmg` cho macOS khi đang dùng Windows:

#### Phương án 1: Build trực tiếp trên Windows (Có giới hạn)
Bạn có thể ra lệnh cho `electron-builder` sinh file cho Mac ngay trên Windows bằng lệnh:
```bash
cd apps/fe
npx electron-builder --mac
```
* **Hạn chế cực kỳ quan trọng:**
  1. **Không ký số (Code Signing) được:** Ứng dụng khi tải về máy Mac sẽ bị hệ thống báo lỗi bảo mật *"App is damaged and can't be opened"* hoặc *"Unidentified Developer"*. Người dùng Mac sẽ cần vào *System Settings -> Privacy & Security* để bấm *Open Anyway* thủ công.
  2. **Lỗi thư viện Native (Playwright):** Do Playwright cần tải các browser binaries tương thích với kiến trúc macOS (Intel/M1/M2). Build trên Windows có thể khiến file app chạy trên macOS không có sẵn nhân Chromium của macOS.

#### Phương án 2: Sử dụng GitHub Actions (Khuyên dùng - Miễn phí)
Bạn có thể đẩy dự án lên GitHub và thiết lập một workflow tự động build ứng dụng trên máy ảo macOS (runner) của GitHub. Cách này giải quyết triệt để vấn đề biên dịch thư viện native.

Tạo file `.github/workflows/build.yml` trong dự án:
```yaml
name: Build Desktop App
on: [push]
jobs:
  release:
    runs-on: macos-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-size: 20
      - name: Install Dependencies
        run: |
          cd apps/fe
          npm install
      - name: Build & Package App
        run: |
          cd apps/fe
          npm run build -- --mac
```

---

### 3.3. Các bước đóng gói (Nếu thực hiện trên macOS)
1. Đảm bảo bạn đang ở thư mục Frontend trên macOS:
   ```bash
   cd apps/fe
   ```
2. Cài đặt các dependencies trên macOS:
   ```bash
   npm install
   ```
3. Chạy lệnh build tĩnh Nuxt và đóng gói qua Electron cho macOS:
   ```bash
   # Build ứng dụng cho nền tảng macOS (sẽ sinh ra file .dmg hoặc .app)
   npm run build -- --mac
   ```
   *Lưu ý: Nếu bạn muốn build cả hai bản Windows và macOS cùng lúc trên macOS, chạy:*
   ```bash
   npx electron-builder --win --mac
   ```

4. Sau khi build hoàn tất, các file đầu ra cài đặt cho macOS (`.dmg`) sẽ nằm ở thư mục:
   ```
   apps/fe/release/
   ```


