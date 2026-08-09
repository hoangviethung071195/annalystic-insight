---
name: n8n-workflow-standards
description: Quy chuẩn thiết kế và vận hành n8n workflows.
---

# Instruction: n8n Workflow Standards

Kỹ năng này đảm bảo các workflow trong n8n được thiết kế khoa học, dễ bảo trì và ổn định.

## Nguyên tắc Modular

- Chia nhỏ các workflow lớn thành các sub-workflows (Sử dụng node `Execute Workflow`).
- Ví dụ: Một workflow xử lý dữ liệu chung sẽ gọi các sub-workflows riêng cho "Ke Toan", "Marketing".

## Error Handling & Logging

- Mỗi workflow phải có node `Error Trigger` để bắt lỗi toàn cục.
- Gửi thông báo lỗi về Slack/Discord hoặc ghi log vào Google Sheets nếu có node thất bại.
- Sử dụng node `Wait` một cách hợp lý để tránh bị rate limit từ phía Google API hoặc LLM Provider.

## Security & API Compliance

- Sử dụng Environment Variables cho các API Keys nhạy cảm.
- Kiểm tra `Authorization` header cho các webhook tiếp nhận yêu cầu từ Flutter app.
- **Quan trọng**: Cấu hình các node Webhook và Webhook Response phải khớp hoàn toàn với [N8N_FLUTTER_CONTRACT.md](file:///c:/work/tuan/bizmind-ai/.agents/docs/N8N_FLUTTER_CONTRACT.md).
