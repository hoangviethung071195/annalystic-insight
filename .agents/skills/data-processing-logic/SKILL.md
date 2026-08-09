---
name: data-processing-logic
description: Quy chuẩn xử lý dữ liệu Google Sheets cho hệ thống RAG.
---

# Instruction: Data Processing Logic

Kỹ năng này quy định cách n8n ETL pipeline xử lý dữ liệu từ Google Sheets trước khi đưa vào Vector Database.

## Quy trình Chuẩn hóa Dữ liệu

1. **Làm sạch (Cleaning)**:
   - Loại bỏ các ký tự đặc biệt không cần thiết.
   - Xử lý các ô trống (Null/Empty values).
2. **Chuẩn hóa (Normalization)**:
   - Chuyển đổi định dạng tiền tệ: "5tr" -> 5.000.000.
   - Định dạng ngày tháng: YYYY-MM-DD.
3. **Phân đoạn (Chunking)**:
   - Chia dữ liệu theo từng dòng (Row-based) cho các sheet danh sách khách hàng/sản phẩm.
   - Chia dữ liệu theo đoạn văn (Paragraph-based) cho các tài liệu hướng dẫn/quy trình.

## Metadata Tagging

Mỗi chunk dữ liệu khi đẩy vào Vector DB (Pinecone/ChromaDB) phải bao gồm các metadata:
- `source`: Tên Sheet/File gốc.
- `department`: Phòng ban sở hữu dữ liệu (ke_toan, marketing, sale).
- `timestamp`: Thời gian cập nhật cuối cùng.
- `row_id`: ID của hàng trong Google Sheets (để truy xuất ngược nếu cần).
