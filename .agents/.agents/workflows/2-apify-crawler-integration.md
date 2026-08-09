# Phase 2: Apify Crawler Integration & WNDI Analysis

Mục tiêu của giai đoạn này là tích hợp API của Apify Facebook Groups Scraper để cào bài viết theo URL động, phân loại W-N-D-I và lưu vào cơ sở dữ liệu, sau đó hiển thị báo cáo dạng Dashboard như mẫu.

## Checklist Công việc

- [ ] Thiết lập Apify Client / Integration trong Backend (`apps/be`):
  - [ ] Tạo service gọi Apify Actor `apify/facebook-groups-scraper` sử dụng `APIFY_API_TOKEN`
  - [ ] Nhận đầu vào là URL nhóm Facebook động và số lượng bài viết cần cào
  - [ ] Parse dữ liệu JSON trả về từ Apify và lưu vào các bảng `groups`, `posts`, `comments` thông qua Prisma
- [ ] Cập nhật module phân tích AI (`apps/be/src/analysis`):
  - [ ] Cập nhật prompt phân tích để phân loại chính xác các yếu tố **Want, Need, Demand, Insight** từ dữ liệu cào được
  - [ ] Hỗ trợ sinh báo cáo dưới dạng HTML tĩnh hoặc JSON có đầy đủ biểu đồ Chart.js
- [ ] Xây dựng Frontend UI (`apps/fe`):
  - [ ] Thiết kế trang Dashboard chính có ô nhập URL nhóm Facebook động
  - [ ] Hiển thị trạng thái tiến trình cào và phân tích
  - [ ] Render báo cáo WNDI trực quan với các biểu đồ phân phối chủ đề và danh sách bài viết tiêu biểu
