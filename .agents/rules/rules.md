---
trigger: always_on
---

# Bizmind AI - Modular RAG System Project Rules

Dự án "Bizmind AI" là hệ thống RAG tự thân (Self-Contained RAG) tích hợp NestJS Backend, PostgreSQL (pgvector) và Flutter Frontend để cung cấp giải pháp AI tra cứu thông tin nội bộ và hỗ trợ các phòng ban (Kế toán, Marketing, Sale).

## Kiến trúc Hệ thống (Architecture)

- **Single Source of Truth**: PostgreSQL Database.
- **AI Orchestrator & API Gateway**: NestJS Backend.
- **Vector Search Engine**: PostgreSQL `pgvector` (sử dụng khoảng cách cosine `<=>` cho vector 1536 chiều).
- **Embedding Model**: OpenAI `text-embedding-3-small` (1536 dimensions).
- **AI Chatbot Model**: DeepSeek / GPT-4o / Claude 3.5 Sonnet.
- **Frontend**: Flutter (Web & Mobile).

## Quy chuẩn Công nghệ & Code

1. **NestJS Backend (AI Orchestrator)**:
   - Tuân thủ các nguyên lý SOLID.
   - Hỗ trợ Streaming Response (Transfer-Encoding: chunked) cho API chat.
   - Đảm bảo xử lý lỗi tập trung và logging rõ ràng cho các tác vụ gọi API ngoại vi (OpenAI, DeepSeek).
2. **PostgreSQL pgvector (Vector DB)**:
   - Lưu trữ đồng thời dữ liệu sản phẩm có cấu trúc và vector tương ứng trong cùng một bảng `Product`.
   - Sử dụng truy vấn SQL Raw (`prisma.$queryRawUnsafe`) để tối ưu hóa tìm kiếm lai (hybrid search) kết hợp lọc cứng bằng SQL (`brand`, `price`, `stock`) với vector search tương đồng.
3. **Flutter (Frontend)**:
   - Tuân thủ Clean Architecture.
   - Tích hợp Streaming Response cho Chat Interface.
   - Sử dụng Chart.js hoặc thư viện tương đương cho Hybrid View (biểu đồ).
   - **Nhất quán Bố cục (Layout & UX Consistency)**:
     - Khi thiết kế hoặc sửa đổi bất kỳ màn hình nào, Agent **BẮT BUỘC** phải tham chiếu đến bố cục của các màn hình chuẩn đang hoạt động tốt trước đó (như `ChatPage`, `DashboardPage`) để kế thừa đúng Layout chung (`MainLayout` chứa Sidebar điều hướng và TopBar), tránh tình trạng render thiếu Sidebar hoặc lệch lạc thiết kế giữa các màn hình.
   - **Quy tắc Responsive & Mobile-First & Desktop Fluid**:
     - Thiết kế giao diện tương thích tốt trên cả Web và Mobile. Tuyệt đối không để xảy ra lỗi tràn màn hình (Overflow/Yellow Banner).
     - **Tối ưu hóa DataTable đa nền tảng**:
       + Để hỗ trợ di động, luôn bọc `DataTable` trong bộ cuộn hai chiều: cuộn dọc bên ngoài và cuộn ngang `SingleChildScrollView(scrollDirection: Axis.horizontal)` bên trong.
       + Để ngăn chặn lỗi bảng bị co cụm và chừa khoảng trống bên phải trên màn hình Desktop, **BẮT BUỘC** bọc `DataTable` bằng `LayoutBuilder` và `ConstrainedBox` với `constraints: BoxConstraints(minWidth: tableConstraints.maxWidth)`. Điều này ép bảng luôn tự động giãn rộng 100% lấp đầy màn hình Desktop, trong khi vẫn cho phép cuộn ngang mượt mà trên Mobile khi bảng phình to vượt chiều rộng màn hình.
       + Điều chỉnh kích thước cột rộng linh hoạt theo thiết bị (ví dụ: bọc cột văn bản dài như tên bằng `SizedBox(width: isMobile ? 180 : 350)`) để tận dụng tối đa bề ngang của Desktop.
     - Khi sử dụng `Row` chứa các phần tử có chiều rộng lớn (như tiêu đề và nút bấm, hoặc thanh lọc nhiều ô), hãy tự động chuyển đổi thành `Column` trên màn hình nhỏ hoặc sử dụng các widget thích ứng (`LayoutBuilder`, `MediaQuery`, `Wrap` thay vì `Row` cứng).
4. **AI & Prompt Engineering**:
   - Sử dụng System Prompt riêng biệt cho từng phòng ban (RBAC).
   - Ưu tiên DeepSeek-Chat hoặc GPT-4o cho logic và tính toán.
5. **Quy tắc Kiểm soát Chất lượng (Quality Control)**:
   - **TypeScript Check**: Luôn kiểm tra lỗi TypeScript sau khi sửa code, đảm bảo không có lỗi biên dịch (Property 'substring' does not exist, etc.) trước khi phản hồi.
   - **Self-Testing**: Sau khi hoàn thành một tính năng hoặc API, Agent phải tự chạy các lệnh kiểm tra (như `curl`, script test) để xác nhận tính năng đã hoạt động đúng, nếu lỗi phải tự sửa ngay trước khi báo cáo cho User.
   - **Visual Verification (Kiểm duyệt Trực quan FE)**: Sau khi phát triển hoặc sửa đổi xong bất kỳ giao diện (Frontend) nào, Agent **BẮT BUỘC** phải tự chạy hoặc mở trình duyệt (sử dụng Browser subagent) để trực tiếp kiểm chứng và tự động chụp lại ảnh màn hình giao diện thực tế ở cả **2 chế độ**: **Desktop Mode** và **Mobile Mode**. Quy trình kiểm duyệt trực quan tuân theo các bước:
     + **Tối ưu hóa Token & Cổng kiểm thử (Port & Token Efficiency)**: Để tối ưu hóa chi phí và tránh lãng phí token cực kỳ đắt đỏ của Browser subagent, Agent **CHỈ** được phép khởi chạy trình duyệt ảo để kiểm duyệt giao diện khi có yêu cầu kiểm thử rõ ràng từ User kèm theo cổng hoạt động chính xác (ví dụ: "hãy test giao diện qua cổng 52610"). Agent tuyệt đối không tự ý mở trình duyệt ngầm để dò tìm hay chạy thử khi chưa có cổng xác nhận từ User.
     + **Kiểm duyệt trên Mobile**: Phát hiện và sửa ngay bất kỳ lỗi tràn màn hình (Overflow/Yellow Banner) nào ở màn hình nhỏ.
     + **Kiểm duyệt trên Desktop**: Đảm bảo Bố cục bảng biểu, danh sách trên màn hình Desktop rộng không bị co cụm méo mó hoặc chừa khoảng trống bất hợp lý.
     + **Độ hoàn mỹ Premium**: Xác minh các thành phần (nút bấm, ô nhập liệu, phông chữ, biểu đồ) được dàn trang đều đặn, cân đối và chuẩn Premium.
     Agent tuyệt đối không được chỉ kiểm tra code biên dịch thành công mà bỏ qua việc kiểm chứng trực quan bằng hình ảnh thực tế.

## Quy trình làm việc & Tự động hóa

- **Chiến lược**: API-First & DB-First (Xây dựng, di cư Database, tối ưu hóa Vector Search trước khi tích hợp UI).
- **Phân quyền (RBAC)**: Đảm bảo kiểm tra quyền truy cập API theo phòng ban trong NestJS middleware/guard.
- **Documentation & Knowledge**:
  - Cập nhật tiến độ vào `PHASE_X_LOG.md`.
  - Cập nhật file `.agents/project-knowledge.md` sau khi hoàn thành tính năng lớn.
  - **Single Source of Truth**: Khi viết code, Agent phải kết hợp giữa **Rules** (Luật), **Skills** (Cách làm) và **Docs/Contract** (Thông số kỹ thuật). Bắt buộc kiểm tra [BE_FLUTTER_CONTRACT.md](file:///c:/work/tuan/bizmind-ai/.agents/docs/BE_FLUTTER_CONTRACT.md) trước khi triển khai bất kỳ kết nối API nào.
  - **Rà soát & Tránh lỗi thời tài liệu (Anti-Outdated Documentation)**: Khi có thay đổi về mặt kiến trúc phần mềm, cấu trúc dữ liệu database hoặc thay thế/loại bỏ các dịch vụ công nghệ chính (ví dụ: loại bỏ n8n, thay đổi cổng API), Agent **BẮT BUỘC** phải rà soát toàn bộ các tài liệu liên quan trong dự án (bao gồm `README.md`, `DEPLOYMENT_GUIDE.md`, các tài liệu API Contract trong `.agents/docs/`, rules dự án và các file `.md` hướng dẫn khác) để cập nhật đồng bộ hoặc xóa bỏ những nội dung đã lỗi thời. Tuyệt đối không để lại thông tin cũ gây hiểu lầm cho quá trình phát triển tiếp theo.

## Tương tác với User

- **Hướng dẫn từng bước (Step-by-Step)**: Chỉ hướng dẫn duy nhất một bước tại một thời điểm. Tuyệt đối không nhắc đến hoặc liệt kê các bước tiếp theo. Chỉ khi User xác nhận đã hoàn thành bước hiện tại mới được phép hướng dẫn bước kế tiếp.

## Security & Privacy

- Mã hóa các thông tin nhạy cảm (API Keys, OTP cho số liệu tài chính).
- Kiểm soát truy cập dữ liệu chặt chẽ qua NestJS Authorization Layer.

## Tự Hoàn Thiện Luật Dự Án (Self-Improving Rules)

- **Phân tích cập nhật luật**: Mỗi khi người dùng yêu cầu sửa lỗi, cải tiến tính năng hoặc phản hồi về sự cố, Agent **BẮT BUỘC** phải phân tích xem nguyên nhân gốc rễ có phải do thiếu hụt quy tắc kiểm định hay không. Từ đó, chủ động đề xuất nâng cấp/sửa đổi file rules của hệ thống để phòng ngừa triệt để lỗi tương tự có thể xảy ra ở tất cả các cấu phần và màn hình khác.
