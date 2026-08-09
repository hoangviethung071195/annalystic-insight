---
description: Phase 1 · Foundation: n8n, Vector DB & Google Sheets
---

# Sprint 1: Nền tảng (Tuần 1-3)

Mục tiêu: Thiết lập cơ sở hạ tầng dữ liệu và khả năng tra cứu thông tin cơ bản.

## 1. Google Sheets Setup
- Quy hoạch lại cấu trúc Google Sheets Master.
- Định dạng dữ liệu theo chuẩn Database Table.
- Thiết lập Webhook để n8n có thể lắng nghe thay đổi.

## 2. n8n ETL Pipeline
- Xây dựng workflow n8n để fetch dữ liệu từ Sheets.
- Preprocessing: Làm sạch và chuẩn hóa dữ liệu.
- Chunking: Chia nhỏ dữ liệu theo logic hàng/nhóm.

## 3. Vector Database & Embedding
- Kết nối Pinecone hoặc ChromaDB.
- Thực hiện Embedding dữ liệu và đẩy vào Vector DB.
- Gắn metadata (department, date) cho từng chunk.

## 4. Basic Retrieval Skill
- Xây dựng kỹ năng "Tra cứu thông tin nội bộ".
- Kết nối LangChain với Vector DB.
- Thử nghiệm truy vấn cơ bản qua n8n.
