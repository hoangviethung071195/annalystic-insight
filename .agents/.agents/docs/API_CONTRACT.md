# API Contract: Crawler & Analyzer

Tài liệu này định nghĩa giao diện API (RESTful) giữa NestJS Backend và Nuxt 3 Frontend.


## 1. Quản Lý Trình Duyệt & Trạng Thái

### POST `/api/crawler/launch`
Mở trình duyệt ở chế độ hiển thị (headful) với persistent context để người dùng đăng nhập Facebook.
- **Response (200)**:
  ```json
  {
    "success": true,
    "message": "Trình duyệt đã được khởi chạy thành công.",
    "status": "ready_to_login"
  }
  ```

### GET `/api/crawler/status`
Lấy trạng thái hiện tại của crawler.
- **Response (200)**:
  ```json
  {
    "browserOpen": true,
    "isLoggedIn": true,
    "currentTask": "idle", // 'idle', 'crawling', 'login_required'
    "crawlingGroup": null
  }
  ```

---

## 2. Quản Lý Tiến Trình Crawl Dữ Liệu

### POST `/api/crawler/run`
Bắt đầu tiến trình crawl một group cụ thể.
- **Request Payload**:
  ```json
  {
    "groupUrl": "https://www.facebook.com/groups/xxxxxxxx",
    "limitPosts": 5
  }
  ```
- **Response (202)**:
  ```json
  {
    "success": true,
    "message": "Đã nhận lệnh crawl. Đang tiến hành quét ngầm.",
    "groupId": 1
  }
  ```

---

## 3. Truy Vấn Dữ Liệu

### GET `/api/groups`
Lấy danh sách các nhóm đã từng quét kèm thống kê.
- **Response (200)**:
  ```json
  [
    {
      "id": 1,
      "name": "Cộng Đồng Khởi Nghiệp",
      "url": "https://www.facebook.com/groups/xxxxxxxx",
      "postCount": 12,
      "commentCount": 154,
      "lastCrawledAt": "2026-06-15 15:30:22"
    }
  ]
  ```

### GET `/api/groups/:id/posts`
Lấy danh sách bài viết và bình luận tương ứng của nhóm.
- **Response (200)**:
  ```json
  {
    "group": {
      "id": 1,
      "name": "Cộng Đồng Khởi Nghiệp"
    },
    "posts": [
      {
        "id": 12,
        "fbPostId": "123456789_987654321",
        "authorName": "Nguyễn Văn A",
        "postText": "Mọi người có recommend dịch vụ hosting nào tốt không?",
        "postUrl": "https://facebook.com/groups/xxxxxxxx/posts/12345/",
        "crawledAt": "2026-06-15 15:30:22",
        "comments": [
          {
            "id": 45,
            "fbCommentId": "987654321_11111",
            "authorName": "Trần Thị B",
            "commentText": "Dùng Vultr đi bạn, rẻ mà ngon.",
            "createdAt": "2026-06-15 15:31:00"
          }
        ]
      }
    ]
  }
  ```

---

## 4. Phân Tích AI

### POST `/api/groups/:id/analyze`
Kích hoạt Gemini API để đọc các bình luận trong nhóm và phân tích nhu cầu/xu hướng.
- **Response (200)**:
  ```json
  {
    "success": true,
    "analysis": {
      "trends": ["Xu hướng hosting giá rẻ", "Nhu cầu hỗ trợ kỹ thuật nhanh"],
      "painPoints": ["Giao diện quản lý hosting phức tạp", "Tốc độ load chậm vào giờ cao điểm"],
      "demands": ["Dịch vụ hosting hỗ trợ 24/7 bằng tiếng Việt"],
      "rawReport": "...Markdown tóm tắt chi tiết..."
    }
  }
  ```

### GET `/api/groups/:id/analysis`
Lấy lịch sử báo cáo phân tích AI của nhóm.
- **Response (200)**:
  ```json
  [
    {
      "id": 3,
      "analysisText": "{...}",
      "createdAt": "2026-06-15 16:00:00"
    }
  ]
  ```
