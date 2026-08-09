---
name: crawler-guide
description: Hướng dẫn kỹ thuật sử dụng Playwright thu thập dữ liệu Facebook ẩn danh và bóc tách cấu trúc DOM.
---

# Instruction: Playwright Facebook Crawler Guide

Kỹ năng này hướng dẫn cách xây dựng một Crawler Engine ổn định, tránh checkpoint từ Facebook và bóc tách dữ liệu bình luận tối ưu.

## 1. Cơ Chế Ẩn Danh & Tránh Checkpoint (Stealth Tactics)

Facebook áp dụng bot detection cực kỳ gắt gao. Để tránh bị quét:
- **Persistent Context**: BẮT BUỘC sử dụng `browserType.launchPersistentContext(userDataDir, options)` thay vì `launch` thông thường. Điều này giúp giữ lại phiên đăng nhập, cookies, và local storage.
- **User Agent & Fingerprint**: Sử dụng User-Agent của trình duyệt thật:
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
- **Tốc độ tự nhiên (Human-like Delays)**:
  - Sử dụng thời gian trễ ngẫu nhiên giữa các thao tác (từ 1 đến 3 giây).
  - Sử dụng hàm cuộn trang mượt mà (smooth scrolling) thay vì nhảy cóc xuống đáy trang ngay lập tức.

## 2. Bóc Tách DOM Bài Viết & Bình Luận (DOM Extraction Rules)

Giao diện Facebook thay đổi liên tục, do đó không nên lạm dụng các CSS selectors quá sâu. Hãy sử dụng các đặc trưng ngữ nghĩa:
- **Bài viết (Post Containers)**: Các bài viết trong feed thường nằm trong các thẻ có vai trò `role="article"` hoặc các container chứa thuộc tính `data-ad-preview="message"` hoặc `data-testid` liên quan.
- **Mở rộng bình luận (Expand Comments)**:
  - Tìm và click vào các phần tử chứa text như: "Xem thêm bình luận", "Xem các bình luận trước", "Xem thêm phản hồi", "View more comments", "Write a reply...".
  - Chờ đợi phần tử bình luận mới hiển thị sau khi click bằng cách gọi `page.waitForTimeout(1000)`.
- **Bóc tách nội dung bình luận (Comment Extractor)**:
  - Bình luận thường nằm trong các cấu trúc cây (tree structure) phân cấp.
  - Tên tác giả bình luận thường là thẻ `a` hoặc `span` có thuộc tính `hovercard` hoặc text in đậm.
  - Nội dung bình luận thường là thẻ div hoặc span nằm cạnh tên tác giả.

## 3. Quản Lý Tiến Trình Trình Duyệt (Process Management)

- Đảm bảo có cơ chế `try...catch...finally` để luôn gọi `browser.close()` hoặc giải phóng tài nguyên khi crawler gặp lỗi đột xuất.
- Lưu trữ trạng thái tiến trình (ví dụ: "Đang kết nối", "Đang quét", "Đang lưu", "Hoàn thành") để báo cáo cho giao diện người dùng.
