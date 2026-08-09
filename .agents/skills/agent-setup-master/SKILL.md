---
name: agent-setup-master
description: Kỹ năng quản trị dùng để thiết lập hoặc đồng bộ hóa toàn bộ thư mục .agents dựa trên file kiến thức dự án (project-knowledge.md).
---

# Instruction: Agent Setup Master (Meta-Skill)

Kỹ năng này được sử dụng khi bắt đầu một dự án mới hoặc khi có sự thay đổi lớn về kiến trúc dự án. Nhiệm vụ của Agent là sử dụng file `project-knowledge.md` làm "Gốc" để tái cấu trúc toàn bộ các file hỗ trợ khác.

## Quy trình Thực hiện (Bootstrap Process)

Khi nhận được yêu cầu "Setup dự án theo project-knowledge.md", Agent phải thực hiện các bước sau:

### Bước 1: Phân tích Nguồn Chân lý (Parsing)
Đọc kỹ `@.agents/project-knowledge.md` để trích xuất các thông tin then chốt:
- **Tech Stack**: Backend, Frontend, Database, AI Models, Tools (n8n, Docker...).
- **Kiến trúc**: Monolith, Microservices, Modular RAG, Clean Architecture...
- **Roadmap**: Các giai đoạn (Phase) và mốc thời gian.
- **Quy tắc đặc thù**: Bảo mật, phân quyền, chuẩn code.

### Bước 2: Tái cấu trúc Quy định (Rules Alignment)
Cập nhật hoặc tạo mới `@.agents/rules/rules.md`:
- Đổi tên dự án và mô tả tổng quan.
- Cập nhật danh sách công nghệ và cấu trúc thư mục dự án.
- Thiết lập lại các quy chuẩn Code và Workflow phù hợp với Stack mới.

### Bước 3: Phân rã Lộ trình (Workflow Generation)
Dựa trên Roadmap trong file nguồn, xóa các file cũ trong `@.agents/workflows/` và tạo các file mới:
- Chia theo Sprint (ví dụ: `1-foundation.md`, `2-feature-x.md`...).
- Mỗi file phải có mục tiêu cụ thể và danh sách checklist công việc.

### Bước 4: Định hình Kỹ năng (Skillset Definition)
- Xác định các kỹ năng (Skills) cần thiết để thực hiện dự án (ví dụ: `nest-js-logic`, `flutter-ui`, `prompt-engineering`).
- Tạo các thư mục Skill tương ứng và viết `SKILL.md` hướng dẫn Agent cách thực thi các công nghệ đó.

### Bước 5: Thiết lập Hợp đồng & Tài liệu (Docs & Contracts)
- Nếu dự án có sự kết nối giữa các thành phần (API, Database), hãy tạo các file Contract trong `@.agents/docs/` (ví dụ: `API_CONTRACT.md`).
- Đảm bảo các Skill và Rules đều có liên kết chéo (cross-reference) tới các file này.

### Bước 6: Đồng bộ Cấu hình Triển khai (Deployment Setup)
- Sao chép nguyên bản các file cấu hình deploy chuẩn từ dự án mẫu (`germanySNT` hoặc `bizmind-ai`) sang dự án mới để đồng bộ quy trình deploy lên GCP:
  - `cloudbuild.yaml` (ở thư mục gốc)
  - `apps/be/Dockerfile` và `apps/fe/Dockerfile`
  - `docker-compose.yml` (nếu có)
- Thay đổi các biến cấu hình, đường dẫn và định danh phù hợp với dự án mới:
  - Tên Service Cloud Run (ví dụ: thay `bizmind-ai` bằng tên Service của dự án mới).
  - Đường dẫn Image trên GCP Artifact Registry / Container Registry (đặc biệt là phần tên repo github, ví dụ: đổi `github.com/hoangviethung071195/bizmind-ai` thành repository mới).
  - Region deploy (ví dụ: `asia-southeast1`).
  - Các cổng mạng (ports) và biến môi trường cấu hình trong Dockerfile/Cloud Run nếu có thay đổi.

## Quy định về Cấu trúc và Công nghệ mặc định (Default Template & Stack)

Khi thiết lập hoặc khởi tạo dự án mới:
1. **Sao chép cấu trúc chuẩn (Clone Structure)**:
   - Phải tạo lập/đồng bộ toàn bộ cấu trúc thư mục chuẩn gồm:
     - `.agents` (chứa rules, workflows, skills, docs của agent)
     - `apps/be` (thư mục mã nguồn Backend)
     - `apps/fe` (thư mục mã nguồn Frontend)
2. **Ngôn ngữ & Thư viện mặc định cho Backend (BE)**:
   - Mặc định sử dụng các công nghệ, thư viện tương tự như dự án `bizmind-ai`: NestJS làm framework chính, Prisma làm ORM, PostgreSQL (với pgvector nếu cần tìm kiếm vector), OpenAI/DeepSeek SDK cho AI logic, và các thư viện chuẩn kèm theo.
3. **Dockerfile BE mặc định**:
   - Khi thiết lập Dockerfile cho Backend (NestJS), sử dụng template chuẩn sau:
     ```dockerfile
     FROM node:20-alpine AS builder

     WORKDIR /app

     # Copy package files
     COPY package*.json ./

     # Install dependencies
     RUN npm ci

     # Copy source code
     COPY . .

     # Build the app
     RUN npm run build

     # Production image
     FROM node:20-alpine

     WORKDIR /app

     # Copy built assets and package files from builder
     COPY --from=builder /app/dist ./dist
     COPY --from=builder /app/package*.json ./

     # Install only production dependencies
     RUN npm ci --only=production

     # Cloud Run defaults to 8080
     EXPOSE 8080

     CMD ["node", "dist/main"]
     ```
4. **Ngôn ngữ & Thư viện mặc định cho Frontend (FE)**:
   - Mặc định sử dụng framework **Nuxt** (Nuxt.js) cho Frontend.
5. **Dockerfile FE mặc định**:
   - Khi thiết lập Dockerfile cho Frontend (Nuxt), sử dụng template chuẩn sau:
     ```dockerfile
     FROM node:22-alpine AS builder

     WORKDIR /app

     # Copy package files
     COPY package*.json ./

     # Install dependencies
     RUN npm ci

     # Copy source code
     COPY . .

     # Build the app
     RUN npm run build

     # Production image
     FROM node:22-alpine

     WORKDIR /app

     # Copy built outputs
     COPY --from=builder /app/.output ./.output
     COPY --from=builder /app/package*.json ./

     # Cloud Run defaults to 8080. Nuxt Nitro server reads PORT env variable.
     EXPOSE 8080
     ENV PORT=8080
     ENV HOST=0.0.0.0

     CMD ["node", ".output/server/index.mjs"]
     ```
6. **Cấu hình Cloud Build mặc định (cloudbuild.yaml)**:
   - Khi thiết lập cấu hình Cloud Build để tự động hóa build và deploy cả Backend (NestJS) và Frontend (Nuxt) lên Cloud Run, sử dụng template chuẩn có tính linh hoạt cao dưới đây (dễ dàng chỉnh sửa hoặc bỏ bớt bước nếu dự án chỉ có BE/FE):
     ```yaml
     steps:
       # =========================================================================
       # BACKEND DEPLOYMENT
       # =========================================================================
       # 1. Build Docker image từ Dockerfile của backend (apps/be)
       - name: 'gcr.io/cloud-builders/docker'
         args:
           - 'build'
           - '-t'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/be:$COMMIT_SHA'
           - '-f'
           - 'apps/be/Dockerfile'
           - 'apps/be'

       # 2. Push Docker image lên Registry
       - name: 'gcr.io/cloud-builders/docker'
         args:
           - 'push'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/be:$COMMIT_SHA'

       # 3. Deploy Backend lên Cloud Run
       - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
         entrypoint: gcloud
         args:
           - 'run'
           - 'deploy'
           - '${_SERVICE_NAME_BE}'
           - '--image'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/be:$COMMIT_SHA'
           - '--region'
           - 'asia-southeast1'
           - '--platform'
           - 'managed'
           - '--allow-unauthenticated'

       # =========================================================================
       # FRONTEND DEPLOYMENT
       # =========================================================================
       # 4. Build Docker image từ Dockerfile của frontend (apps/fe)
       - name: 'gcr.io/cloud-builders/docker'
         args:
           - 'build'
           - '-t'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/fe:$COMMIT_SHA'
           - '-f'
           - 'apps/fe/Dockerfile'
           - 'apps/fe'

       # 5. Push Docker image lên Registry
       - name: 'gcr.io/cloud-builders/docker'
         args:
           - 'push'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/fe:$COMMIT_SHA'

       # 6. Deploy Frontend lên Cloud Run
       - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
         entrypoint: gcloud
         args:
           - 'run'
           - 'deploy'
           - '${_SERVICE_NAME_FE}'
           - '--image'
           - 'gcr.io/$PROJECT_ID/$REPO_NAME/fe:$COMMIT_SHA'
           - '--region'
           - 'asia-southeast1'
           - '--platform'
           - 'managed'
           - '--allow-unauthenticated'

     images:
       - 'gcr.io/$PROJECT_ID/$REPO_NAME/be:$COMMIT_SHA'
       - 'gcr.io/$PROJECT_ID/$REPO_NAME/fe:$COMMIT_SHA'

     options:
       logging: CLOUD_LOGGING_ONLY

     substitutions:
       _SERVICE_NAME_BE: my-project-be
       _SERVICE_NAME_FE: my-project-fe
     ```
7. **Quy tắc thay thế**:
   - Chỉ được phép sử dụng các ngôn ngữ, thư viện hoặc framework khác khi có yêu cầu đặc thù rõ ràng từ phía người dùng (USER).

## Nguyên tắc Vận hành
- **Reset-First**: Ưu tiên xóa bỏ các file không còn phù hợp để tránh gây nhiễu context (Halucination).
- **Consistency**: Luôn đảm bảo tên biến, tên trường và cấu trúc trong Contract khớp với logic trong Skills.
- **Independence**: Skill này không chứa logic dự án, nó chỉ chứa logic để "Xây dựng" các dự án khác.
