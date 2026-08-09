---
name: chatbot-diagnostics
description: Đọc, chuẩn đoán và phân tích chi tiết luồng xử lý tin nhắn của Chatbot RAG (Facebook Webhook -> Database -> Model LLM -> Facebook Graph API).
---

# Instruction: Chatbot Diagnostics

Kỹ năng này dùng để phân tích logs Cloud Run và PostgreSQL DB nhằm xác định lỗi ở giai đoạn nào trong luồng giao tiếp của chatbot.

## Cách sử dụng

Mỗi khi người dùng báo lỗi "Chatbot không phản hồi" hoặc "Có lỗi khi gửi tin nhắn", Agent chạy script chuẩn đoán hỗ trợ có sẵn:

```bash
python .agents/skills/chatbot-diagnostics/scripts/diagnose_chatbot.py
```

Lệnh này sẽ quét:
1. Kết nối database và trạng thái tin nhắn lưu trữ gần nhất.
2. Log Cloud Run của NestJS backend và dựng lại timeline giao dịch để chỉ ra bước lỗi (Webhook, DB, Classifier, pgvector, LLM, hay Send API).

## Quy chuẩn tự hoàn thiện & cập nhật lỗi mới (Self-Improving Skill)

> [!IMPORTANT]
> Khi chạy script chuẩn đoán và phát hiện có lỗi xảy ra ở bước **Intent Classified**, **RAG Product Query**, hoặc **AI LLM Generation** nhưng chi tiết lỗi hiển thị chung chung hoặc thuộc về một kiểu lỗi mới (ví dụ: lỗi mạng, lỗi phân giải DNS, lỗi cấu hình vector, token bị hết hạn theo kiểu mới...), Agent **BẮT BUỘC** phải:
> 1. Trích xuất cụm từ khóa (error signature) đặc trưng của lỗi đó.
> 2. Cập nhật trực tiếp vào hàm phân tích lỗi `analyze_llm_error` hoặc bổ sung các điều kiện phân tích lỗi mới trong tệp [diagnose_chatbot.py](file:///c:/work/tuan/bizmind-ai/.agents/skills/chatbot-diagnostics/scripts/diagnose_chatbot.py).
> 3. Tuyệt đối không để xảy ra trường hợp phát hiện loại lỗi mới mà không bổ sung dấu hiệu nhận biết của nó vào mã nguồn chuẩn đoán cho các lần chạy sau.
