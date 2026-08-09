---
name: flutter-hybrid-ui
description: Tiêu chuẩn thiết kế giao diện Flutter cho Chatbot & Dashboard.
---

# Instruction: Flutter Hybrid UI

Kỹ năng này định hướng xây dựng giao diện Flutter theo phong cách hiện đại, hỗ trợ tương tác chatbot và hiển thị dữ liệu thông minh.

## Chat Interface Standards

1. **Streaming Response**: Hiển thị chữ theo thời gian thực khi AI phản hồi.
2. **Message Bubbles**: Phân biệt rõ tin nhắn người dùng và AI.
3. **Rich Content**: Hỗ trợ hiển thị Markdown, Table và Link trong tin nhắn AI.

## Hybrid View (Biểu đồ)

AI có thể yêu cầu hiển thị biểu đồ dựa trên dữ liệu Sheets. Flutter app cần:
- Tích hợp thư viện biểu đồ (như `fl_chart`).
- Nhận dữ liệu JSON từ AI/n8n để vẽ biểu đồ tương ứng (Pie, Bar, Line).

## API Integration

Khi xây dựng các tính năng kết nối với n8n (Chat, Dashboard, Verify OTP), Agent bắt buộc phải tuân thủ đúng Endpoint, Method và định dạng Payload được quy định tại [N8N_FLUTTER_CONTRACT.md](file:///c:/work/tuan/bizmind-ai/.agents/docs/N8N_FLUTTER_CONTRACT.md).

## Clean Architecture

- Sử dụng BLoC hoặc Riverpod cho state management.
- Tách rời lớp UI, Domain và Data.
- Đảm bảo responsive cho cả Mobile và Web.
