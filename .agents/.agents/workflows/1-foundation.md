# Phase 1: Foundation Setup

Mục tiêu của giai đoạn này là khởi tạo khung thư mục dự án, thiết lập các tệp cấu hình, cài đặt dependencies cần thiết cho cả backend và frontend, và khởi tạo database SQLite/PostgreSQL qua Prisma.

## Checklist Công việc

- [x] Khởi tạo cấu trúc ứng dụng mono-repo: `apps/be` (NestJS) và `apps/fe` (Nuxt 3)
- [x] Cấu hình Prisma và kết nối Database PostgreSQL (Neon DB)
- [x] Cài đặt các thư viện cần thiết cho AI Analysis (Google Generative AI, OpenAI/DeepSeek SDK)
- [x] Thiết lập biến môi trường cơ bản (.env)
- [x] Tích hợp Apify Token vào môi trường backend (.env)
