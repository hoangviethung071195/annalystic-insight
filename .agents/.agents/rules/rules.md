# Facebook Group Comments Crawler & Analyzer - Project Rules

Dự án này là hệ thống hỗ trợ thu thập dữ liệu bình luận từ các hội nhóm Facebook và phân tích xu hướng bằng AI sử dụng NestJS Backend và Nuxt 3 Frontend.

## Quy chuẩn Công nghệ & Code

1. **Backend (NestJS)**:
   - Sử dụng NestJS làm framework chính, Prisma làm ORM tương tác với Database.
   - Viết code tường minh, xử lý lỗi chặt chẽ, đặc biệt là khi tương tác với API của Apify hoặc DOM.
   - Đảm bảo xử lý lỗi tập trung và logging rõ ràng cho các tác vụ gọi API ngoại vi.
2. **Frontend (Nuxt 3 / TypeScript / Vanilla CSS)**:
   - Sử dụng Nuxt 3 (Vue 3) với TypeScript định nghĩa kiểu rõ ràng.
   - Thiết kế giao diện hiện đại theo phong cách Glassmorphism, phối màu HSL tinh tế, dark/light mode hoặc dark mode mặc định cao cấp.
   - **Quy tắc Responsive**:
     - Hỗ trợ tốt cho cả màn hình Desktop và thiết bị di động (Mobile).
     - Tuyệt đối không để xảy ra lỗi tràn màn hình (Horizontal scroll ngoài ý muốn hoặc dải sọc vàng lỗi/overflow).
     - Mọi DataTable hiển thị bình luận hoặc bài viết trên Mobile phải được bọc trong vùng cuộn ngang thích hợp.
3. **AI & Prompt Engineering**:
   - Sử dụng System Prompt chuyên biệt để phân tích xu hướng và điểm đau (pain points) của khách hàng từ đống bình luận thô.
   - Định dạng đầu ra từ AI nên là JSON chuẩn hoặc cấu trúc Markdown đẹp để dễ dàng phân tích và hiển thị lên giao diện.
4. **Quy tắc Kiểm soát Chất lượng (Quality Control)**:
   - **TypeScript Check**: Luôn kiểm tra lỗi biên dịch TypeScript trước khi hoàn thành công việc.
   - **Self-Testing**: Sau khi viết API, phải tự chạy kiểm tra (bằng curl hoặc script) để xác nhận API hoạt động bình thường.
   - **Visual Verification (Kiểm duyệt Trực quan FE)**: Sau khi thay đổi giao diện, Agent bắt buộc phải tự chạy thử hoặc mở trình duyệt (thông qua Browser subagent) để trực tiếp kiểm chứng giao diện ở cả **Desktop Mode** và **Mobile Mode**.
     + **Tối ưu hóa Token**: Chỉ khởi chạy trình duyệt ảo khi có yêu cầu kiểm thử rõ ràng từ User kèm theo cổng hoạt động chính xác. Agent tuyệt đối không tự ý mở trình duyệt ngầm khi chưa có cổng xác nhận từ User.
5. **Tương tác với User**:
   - **Hướng dẫn từng bước (Step-by-Step)**: Chỉ hướng dẫn duy nhất một bước tại một thời điểm. Tuyệt đối không nhắc đến hoặc liệt kê các bước tiếp theo. Chỉ khi User xác nhận đã hoàn thành bước hiện tại mới được phép hướng dẫn bước kế tiếp.

