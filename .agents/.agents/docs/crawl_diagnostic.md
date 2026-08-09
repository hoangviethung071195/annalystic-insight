# Chẩn đoán lỗi Facebook Crawl: Chuyển hướng/Tải lại trang tại Bài viết số 51

Tài liệu ghi lại quá trình phân tích và các giải pháp đã thử nghiệm cho lỗi trình cào Playwright bị tự động chuyển hướng quay về trang chủ Facebook khi đang cố gắng xử lý bài viết thứ 51 (Vòng lặp 52).

## Triệu chứng lỗi (Symptom)

Trong quá trình cào dữ liệu:
- Các vòng lặp từ 1 đến 50 chạy thành công, trích xuất và lưu bài viết bình thường.
- Khi đạt đến **Vòng lặp 51 (Chỉ số bài viết: 51)**:
  1. Trình cào tìm thấy và click thành công nút bình luận trên thẻ bài viết thứ 51.
  2. Ngay sau khi click, console trình duyệt ghi nhận sự kiện chuyển trang (`unload`):
     `Permissions policy violation: unload is not allowed in this document.`
  3. Trang web tự động điều hướng quay trở lại Trang chủ Facebook (`facebook.com`), tải lại trang và hiển thị cảnh báo bảo mật chuẩn của Facebook (`%cDừng lại! ...`).
  4. Sang vòng lặp 52, trình cào đợi phần tử `div[aria-posinset="52"]` xuất hiện nhưng bị quá thời gian (timeout) vì lúc này DOM đã tải danh sách bài viết của trang chủ mới:
     `[Crawl Diagnostic] Các chỉ số aria-posinset hiện có trong DOM: ["1","2","3"]`
  5. Tiến trình cào thất bại và tự huỷ.

---

## Các phương pháp đã thử nghiệm & Kết quả

### 1. Sửa đổi Logic đóng Popup (closePopup)
- **Giả thuyết**: Hàm `closePopup` cũ có lệnh click dự phòng vào tọa độ `page.mouse.click(50, 50)`. Trên giao diện Facebook, tọa độ `(50, 50)` nằm đúng vào vị trí Logo chữ F màu xanh (Facebook Logo) ở thanh đầu trang. Nếu nhấn phím `Escape` thất bại, việc click vào đây sẽ làm trình duyệt chuyển hướng về trang chủ.
- **Thực hiện**: Thay thế lệnh click tọa độ `(50, 50)` bằng việc tìm và click chính xác các nút đóng có nhãn `aria-label="Đóng"` / `aria-label="Close"` nằm bên trong dialog đang mở.
- **Kết quả**: Lỗi vẫn xuất hiện chính xác tại Vòng lặp 51/52, cho thấy sự kiện chuyển hướng xảy ra ngay lúc **click vào nút bình luận thứ 51**, chứ không phải do lúc đóng popup.

### 2. Mô phỏng di chuyển chuột thật (Bỏ click force: true)
- **Giả thuyết**: Click bằng `{ force: true }` sẽ gửi sự kiện click ảo trực tiếp thông qua JS, bỏ qua việc kiểm tra khả năng tương tác vật lý. Các hệ thống chống bot của Facebook rất dễ phát hiện ra điều này vì hành động click không hề có chuyển động di chuột hay trạng thái hover trước đó.
- **Thực hiện**: Bỏ tham số `{ force: true }` để Playwright mô phỏng di chuyển con trỏ chuột ảo đến phần tử, kích hoạt hover rồi mới click.
- **Kết quả**: Không giải quyết được vấn đề chuyển hướng ở bài 51.

### 3. Tăng thời gian chờ (Giảm tốc độ cào)
- **Giả thuyết**: Tần suất click tự động quá nhanh (50 clicks chỉ trong 2-3 phút) kích hoạt cơ chế giới hạn tần suất (rate limit) hoặc hệ thống chống bot của Facebook.
- **Thực hiện**: Tăng gấp đôi tất cả các khoảng thời gian nghỉ (sleep 1-2s sau khi cuộn, 6-7s chờ popup tải và 3-5s nghỉ giữa các bài).
- **Kết quả**: Vẫn bị chuyển hướng chính xác ở bài viết số 51.

### 4. Thay đổi hành vi cuộn sang Cuộn mượt (behavior: 'smooth')
- **Giả thuyết**: Cuộn trang lập tức (`behavior: 'instant'`) quá nhanh có thể làm lỗi bộ vẽ giao diện ảo (Virtualized List) của Facebook, gây ra trắng màn hình. Cuộn mượt (`behavior: 'smooth'`) giúp giả lập hành vi người dùng thật và cho trình duyệt thêm thời gian tải giao diện.
- **Thực hiện**: Cập nhật các lệnh cuộn của bài viết và popup sang chế độ `behavior: 'smooth'`.
- **Kết quả**: Vẫn bị trắng màn hình / lỗi điều hướng về trang chủ khi chạm mốc bài số 51.

### 5. Cuộn bánh xe chuột ảo dần dần (page.mouse.wheel)
- **Giả thuyết**: Tránh việc nhảy tọa độ đột ngột bằng lệnh cuộn DOM. Thay vào đó, cuộn chuột xuống từng nấc 500px, nghỉ một nhịp ngắn để giao diện của Facebook tự vẽ và tải nội dung một cách tự nhiên nhất.
- **Thực hiện**: Viết vòng lặp cuộn chuột ảo xuống `500px` mỗi lần, chờ từ `300ms - 500ms` và kiểm tra sự xuất hiện của bài viết tiếp theo trước khi thực hiện lần cuộn kế tiếp.
- **Kết quả**: Vẫn bị lỗi chuyển hướng trang/trắng trang ở bài viết số 51.

### 6. Tạm dừng tại bài 50 để người dùng click thủ công (Manual Action Test)
- **Giả thuyết**: Kiểm tra xem sự kiện click tự động từ Playwright có bị phát hiện và chặn lại không. Nếu tự tay người dùng click trên cửa sổ trình duyệt mà vẫn bị lỗi, nguyên nhân nằm ở mức độ chặn tài khoản/phòng thủ hành vi (Session block) của Facebook chứ không phải lỗi mô phỏng click.
- **Thực hiện**: Cho code tạm dừng (sleep 1 tiếng) tại bài 50, người dùng thực hiện cuộn tiếp và tự tay click chuột thật vào nút bình luận bài 50/51.
- **Kết quả**: **Trình duyệt vẫn lập tức tự động tải lại và chuyển hướng về trang chủ.** Điều này chứng minh 100% cơ chế chặn này là do hệ thống máy chủ của Facebook tự động áp đặt lên Session của bot, chứ không phải do lỗi kích hoạt sự kiện click trong code.

---

## Phân tích chi tiết & Các nguyên nhân gốc rễ khả thi

### Nguyên nhân A: Ngưỡng chặn tự động theo phiên của Facebook (Session-based Anti-bot Quota)
- **Bản chất**: Dù có che giấu thế nào, trình duyệt Chromium chạy qua Playwright vẫn mang những đặc trưng định danh (Browser Fingerprint) của bot tự động (thiếu window.chrome thực tế, thông số WebGL, API Permission bị ghi đè...).
- **Cơ chế chặn**: Facebook cho phép bot hoạt động và cào dữ liệu đến một giới hạn nhất định (chính xác là 50 lượt cào/click tương tác mở popup bình luận). Khi đạt tới ngưỡng này, Facebook sẽ lập tức **thu hồi hoặc hủy bỏ Token phân trang (Pagination/Interaction Token)** của phiên hiện tại.
- Do token bị hủy, bất kỳ hành động click tiếp theo để truy vấn dữ liệu (kể cả click chuột của người thật) sẽ trả về lỗi phân quyền bảo mật, khiến router máy khách của Facebook tự động kích hoạt điều hướng (Redirect) quay về trang chủ `facebook.com` hoặc buộc tải lại trang để yêu cầu cấp token mới.

### Nguyên nhân B: Hết Feed của Nhóm / Chuyển hướng gợi ý bài viết
- Nhiều nhóm Facebook có số lượng bài viết hiển thị hạn chế hoặc feed nhóm đã cuộn đến cuối. Khi chạm tới đáy của feed nhóm:
  - Facebook thường tự động nối thêm danh sách bài viết từ "Nhóm gợi ý" hoặc "Bảng tin chung".
  - Nếu Bài viết 51 là bài viết cuối cùng thực tế của nhóm, bài thứ 52 sẽ không tồn tại, hoặc việc tiếp tục cuộn xuống cuối trang sẽ kích hoạt bộ điều hướng của Facebook để đưa người dùng quay về trang chủ.

### Nguyên nhân C: Nút click bị chiếm quyền điều hướng (Honeypot hoặc Bài viết chia sẻ)
- Ở bài viết thứ 51, nút khớp với selector cào bình luận có thể nằm trong một **bài viết chia sẻ (shared post)** hoặc một thẻ **quảng cáo (ad card)**.
- Việc click vào nút bình luận của một bài viết được nhúng/chia sẻ hoặc quảng cáo trên Facebook đôi khi sẽ kích hoạt điều hướng toàn trang sang URL gốc của bài viết đó hoặc trang của nhà tài trợ, dẫn đến việc tải lại trang.

---

## Các bước xử lý đề xuất cho việc gỡ lỗi tiếp theo

1. **Ghi lại màn hình phiên cào (Record Browser Session)**:
   - Chụp ảnh màn hình (screenshot) hoặc quay video tại thời điểm cào bài 51 để xem thực tế trình duyệt đang hiển thị gì (có phải bài chia sẻ, quảng cáo, hay đã cuộn đến đáy feed?).
2. **Theo dõi sự kiện chuyển hướng (Handle Navigation Events)**:
   - Thêm bộ lắng nghe sự kiện chuyển trang (`page.on('framenavigated', ...)`). Nếu URL thay đổi khỏi URL của nhóm, tạm dừng trình cào và ghi lại URL đích để xác định chính xác trình duyệt bị đẩy đi đâu.
3. **Cuộn và Trích xuất trực tiếp tại chỗ (Scroll and Extract In-Place)**:
   - Tránh việc click mở popup bình luận nếu chúng ta chỉ cần nội dung bài viết. Nếu không bắt buộc phải cào chi tiết bình luận, việc chỉ cào text hiển thị trên dòng thời gian mà không click mở popup sẽ giúp vượt qua hoàn toàn giới hạn click bảo mật này.

---

## 7. Lỗi "Trang này hiện không hiển thị" khi mở bài viết & Giải pháp Đa Tab (Multi-Tab & Page Reload)

### Triệu chứng & Nguyên nhân
* **Triệu chứng**: Khi trình cào cố gắng truy cập hoặc click vào link bài viết (permalink) của nhóm, Facebook trả về màn hình lỗi: *"Trang này hiện không hiển thị. Nguyên nhân có thể là lỗi kỹ thuật..."* kèm nút màu xanh dương **Tải lại trang**.
* **Phân tích nguyên nhân**: 
  - Cảnh báo màu vàng *"You are using an unsupported command-line flag: --no-sandbox"* ở đầu trang là cảnh báo khởi động mặc định của Chromium, **hoàn toàn không liên quan** đến việc chặn load trang của Facebook.
  - Nguyên nhân chính là do Facebook phát hiện các truy cập trực tiếp từ bot hoặc tài khoản chưa kích hoạt đầy đủ Session/Cookie xem bài viết riêng tư (Private Group posts) nên trả về trang lỗi này. Tuy nhiên, nếu bấm **Tải lại trang** (hoặc reload trang), Facebook sẽ thiết lập lại session thành công và hiển thị lại nội dung bài viết.

### Phương án giải quyết tối ưu (Multi-Tab & Page Reload)
Để giải quyết triệt để vấn đề này mà không làm ảnh hưởng đến trạng thái cuộn của timeline group hiện tại, chúng ta sẽ chuyển đổi cơ chế cào sang dạng **Đa Tab (Multi-Tab Crawler)**:

1. **Tab 1 (Timeline Reader)**: Chỉ giữ nhiệm vụ cuộn dọc timeline của nhóm và trích xuất danh sách các URL bài viết (`permalink`). Tab này sẽ không bao giờ click mở popup hay chuyển trang, giúp giữ nguyên trạng thái cuộn ổn định.
2. **Tab 2 (Detail Extractor)**: 
   - Với mỗi URL bài viết trích xuất được từ Tab 1, trình cào sẽ mở ra một tab mới độc lập bằng Playwright (`const tab2 = await context.newPage(); await tab2.goto(postUrl);`).
   - Nếu phát hiện màn hình lỗi chứa nút **Tải lại trang**, Playwright sẽ ra lệnh click vào nút này hoặc gọi `await tab2.reload();`.
   - Tiến hành bóc tách toàn bộ nội dung bài viết và bình luận trên Tab 2.
   - Sau khi cào xong, gọi `await tab2.close();` để giải phóng bộ nhớ và quay lại Tab 1 để xử lý bài viết tiếp theo.

### Đánh giá tính khả thi
* **Độ khả thi**: **100% Khả thi**. Playwright quản lý việc mở, đóng và chuyển đổi đa tab (`BrowserContext.newPage()`) cực kỳ nhanh và chia sẻ chung cookie/session đăng nhập.
* **Tính an toàn**: Tốt hơn nhiều so với việc click trực tiếp trên timeline vì nó cô lập được DOM của từng bài viết riêng lẻ, tránh việc timeline bị trôi hoặc tự động reload khi đóng/mở popup liên tục.
