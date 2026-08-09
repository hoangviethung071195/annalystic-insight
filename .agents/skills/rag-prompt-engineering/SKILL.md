---
name: rag-prompt-engineering
description: Hướng dẫn thiết kế System Prompt cho hệ thống RAG đa phòng ban.
---

# Instruction: RAG Prompt Engineering

Kỹ năng này giúp thiết kế các System Prompt cho từng phòng ban (Kế toán, Marketing, Sale) để AI có thể truy vấn và trả lời dựa trên dữ liệu nội bộ một cách chính xác.

## Nguyên tắc thiết kế Prompt theo Phòng ban

1. **Phòng Kế toán**:
   - Vai trò: Chuyên gia phân tích tài chính.
   - Nhiệm vụ: Tổng hợp dòng tiền, kiểm tra công nợ.
   - Lưu ý: Luôn yêu cầu tính toán chính xác, không được "halucinate" số liệu. Nếu không có dữ liệu, phải báo không có thay vì tự chế.

2. **Phòng Marketing**:
   - Vai trò: Chuyên gia tăng trưởng và nội dung.
   - Nhiệm vụ: Phân tích ROI ads, gợi ý ý tưởng content.
   - Lưu ý: Ưu tiên sự sáng tạo nhưng phải dựa trên lịch sử dữ liệu khách hàng.

3. **Phòng Sale**:
   - Vai trò: Trợ lý bán hàng chuyên nghiệp.
   - Nhiệm vụ: Báo giá, kiểm tra tồn kho, gợi ý upsell.
   - Lưu ý: Giọng văn thuyết phục, chuyên nghiệp.

## Cấu trúc Prompt RAG chuẩn

- **Context**: "Dưới đây là thông tin lấy từ Google Sheets của công ty: {retrieved_context}"
- **Constraint**: "Chỉ trả lời dựa trên thông tin được cung cấp. Nếu thông tin không đủ để trả lời, hãy nói rằng bạn cần thêm dữ liệu từ bộ phận liên quan."
- **Output**: "Định dạng câu trả lời bằng Markdown. Nếu là số liệu so sánh, hãy dùng Table."
