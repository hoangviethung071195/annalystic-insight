---
name: gcp-logging-reader
description: Đọc và phân tích logs từ Google Cloud Platform (GCP) sử dụng Service Account.
---

# Instruction: GCP Logging Reader

Kỹ năng này cung cấp khả năng tự động truy vấn và đọc log từ các dịch vụ của GCP (như Cloud Run, Cloud Build, GKE, VM, v.v.) bằng cách sử dụng Service Account đã cấu hình.

## Tệp cấu hình xác thực (Credentials)
- **Đường dẫn key**: `c:\work\tuan\bizmind-ai\.gcp-key.json` (tệp tin này đã được cấu hình và đưa vào `.gitignore`).
- **GCP Project ID**: `bizmind-ai-494514`

## Cách sử dụng

Để đọc logs, Agent chạy script Python hỗ trợ có sẵn:

```bash
python .agents/skills/gcp-logging-reader/scripts/read_logs.py [options]
```

### Các tùy chọn tham số (Options):
- `--project <PROJECT_ID>`: Project ID của GCP (mặc định: `bizmind-ai-494514`).
- `--limit <LIMIT>`: Số lượng dòng log tối đa cần đọc (mặc định: `50`).
- `--filter <FILTER>`: Bộ lọc Cloud Logging filter chuẩn của GCP. Ví dụ:
  - Xem logs của Cloud Run: `resource.type="cloud_run_revision" AND resource.labels.service_name="nestjs-backend"`
  - Xem các logs lỗi: `severity>=ERROR`
  - Tìm kiếm từ khóa cụ thể: `textPayload:"FacebookService"`
- `--key-file <KEY_FILE_PATH>`: Đường dẫn đến file Key JSON (mặc định tự động nhận diện từ `.gcp-key.json`).

## Ví dụ lệnh chạy:
```bash
python .agents/skills/gcp-logging-reader/scripts/read_logs.py --limit 20 --filter "resource.type=\"cloud_run_revision\" AND severity>=ERROR"
```
