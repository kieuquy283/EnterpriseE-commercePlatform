---
document_id: BRD-01
title: Tài liệu yêu cầu nghiệp vụ
version: 0.1.0
status: Draft
owner: Trưởng nhóm phân tích nghiệp vụ/sản phẩm (chưa phân công)
reviewer: Đại diện vận hành và giảng viên (chưa xác định)
last_updated: 2026-11-15
source_of_truth: true
related_documents:
  - ../00-project/project-charter.md
  - ../00-project/scope-and-assumptions.md
  - ../00-project/source-and-assumption-register.md
  - business-capability-map.md
  - business-processes.md
  - business-rules.md
---

# Tài liệu yêu cầu nghiệp vụ (BRD)

## 1. Kiểm soát tài liệu

**Trạng thái:** Draft. Chưa có doanh nghiệp tài trợ, người duyệt chính sách hoặc biên bản phê duyệt. Tài liệu mô tả kết quả nghiệp vụ **đề xuất** cho một nhà bán lẻ thời trang Việt Nam giả định. Nhãn nguồn và quyết định mở nằm trong [sổ nguồn và giả định](../00-project/source-and-assumption-register.md).

## 2. Tóm tắt điều hành và mô hình kinh doanh

Doanh nghiệp cần kênh online để khách tìm một mẫu thời trang, chọn đúng biến thể có thể bán theo size/màu, đặt hàng, biết kết quả và theo dõi tiến độ. Nhân viên cần xử lý sản phẩm, tồn kho, đơn và báo cáo trong phạm vi quyền. Niềm tin của khách phụ thuộc vào giá và khả năng cung ứng nhất quán, một đơn được chấp nhận cho mỗi ý định mua, cũng như phân biệt rõ trạng thái đơn, thanh toán và giao hàng. Đây là mô hình **PROJECT-PROPOSED** theo ASM-001/002, không phải mô tả hoạt động nội bộ của SOMEHOW. [SRC-C-001, SRC-P-001]

Website công khai của SOMEHOW có danh mục thời trang, tìm kiếm và giỏ hàng; điều kiện giao dịch mô tả việc chọn hàng, nhập thông tin giao, chọn thanh toán rồi xác nhận. Đó là **hành trình tham chiếu có thể quan sát**, không phải quy trình As-Is nội bộ đã kiểm chứng. Nhóm chưa có phỏng vấn hoặc số liệu vận hành nội bộ. [SRC-E-001, SRC-E-002]

## 3. Vấn đề kinh doanh và nguyên nhân cần xác minh

Các mã dưới đây giữ từ tài liệu dự án cũ. Chúng là **tình huống giả định**, không phải sự cố được ghi nhận tại SOMEHOW. Nguyên nhân chỉ là giả thuyết cần kiểm chứng. [SRC-P-001]

| Mã | Tác động kinh doanh nếu xảy ra | Nguyên nhân giả định, chưa xác minh |
|---|---|---|
| BP-01 | Khách thấy sai giá/khả năng cung ứng của biến thể; cửa hàng có thể phải hủy đơn và mất uy tín | Thông tin sản phẩm, giá và số có thể bán thay đổi ở các thời điểm khác nhau |
| BP-02 | Gửi lại checkout có thể tạo thêm đơn, ghi nhận thanh toán sai hoặc khiến kết quả không rõ | Chưa định nghĩa ranh giới một ý định mua và thao tác gửi lại |
| BP-03 | Lỗi thông báo làm chậm hoặc ảnh hưởng xác nhận mua | Công việc liên lạc phụ thuộc quá chặt vào quyết định nhận đơn |
| BP-04 | Gián đoạn bán hàng không được phát hiện sớm | Chưa thống nhất tín hiệu vận hành và người xử lý |
| BP-05 | Phát hành/khôi phục phiên bản gây gián đoạn | Chưa rõ trách nhiệm kiểm soát thay đổi và phục hồi |
| BP-06 | Khách đông làm giảm khả năng xem và mua hàng | Giả định năng lực phục vụ chưa được đo theo tình huống nhu cầu |

## 4. Mục tiêu nghiệp vụ

Mã và các con số gốc đến từ tài liệu dự án lịch sử. Đây là **mục tiêu**, không phải kết quả đã đo. Việc chốt chỉ số NFR và tải nằm ở giai đoạn sau. [SRC-P-001]

| Mã | Diễn giải nghiệp vụ đề xuất | Vấn đề liên quan |
|---|---|---|
| OBJ-01 | Trình diễn hành trình tìm → chọn → đặt → xem trạng thái đơn trọn vẹn | BP-01, BP-02 |
| OBJ-02 | Thanh toán lỗi và gửi lại ý định mua tạo kết quả đơn an toàn, không mơ hồ | BP-02 |
| OBJ-03 | Số lượng cam kết bán và khả năng cung ứng của từng biến thể nhất quán khi nhiều người cùng mua | BP-01, BP-02 |
| OBJ-04 | Đơn đã nhận không bị hủy vì lỗi thông báo; có thể theo dõi và liên lạc lại | BP-03 |
| OBJ-05 | Khách vẫn xem hàng được ở mức đỉnh khuyến mại đã định nghĩa | BP-06 |
| OBJ-06 | Khách vẫn đặt hàng được ở mức đỉnh giao dịch đã định nghĩa | BP-06 |
| OBJ-07 | Việc phát hành và phát hiện sự cố hỗ trợ vận hành bán hàng có kiểm soát | BP-04, BP-05 |
| OBJ-08 | Khả năng phục hồi giới hạn gián đoạn và mất dữ liệu kinh doanh | BP-04, BP-05 |

## 5. Nhu cầu của các bên liên quan

| Vai trò | Nhu cầu nghiệp vụ |
|---|---|
| Khách hàng | Thấy đúng sản phẩm, biến thể, giá và tình trạng bán; nhận kết quả mua rõ ràng; xem riêng trạng thái đơn của mình |
| Nhân viên cửa hàng | Xử lý ngoại lệ về tồn kho và đơn; cập nhật tiến độ hợp lệ |
| Quản trị viên | Quản lý danh mục, quyền truy cập và báo cáo cơ bản |
| Nhóm/giảng viên đánh giá | Truy vết phạm vi, mục tiêu đo được và bằng chứng, không có tuyên bố triển khai quá mức |

Mục tiêu chi tiết của từng vai trò và hành trình người dùng thuộc giai đoạn `02-users/`.

## 6. Danh mục yêu cầu nghiệp vụ

Tất cả dòng dưới đây có trạng thái **Draft / PROJECT-PROPOSED**. Chủ yêu cầu mới là vai trò, chưa gán tên người. Cách kiểm chứng là dấu hiệu ở mức nghiệp vụ, chưa phải test case kỹ thuật. [SRC-C-001, SRC-P-001, SRC-P-002]

| Mã | Doanh nghiệp cần có khả năng… | BP → OBJ | Chủ yêu cầu / ưu tiên | Cách biết đạt ở mức nghiệp vụ; nguồn |
|---|---|---|---|---|
| BREQ-IDENT-001 | xác lập danh tính khách và quyền truy cập phù hợp vai trò | BP-02 → OBJ-01 | Trưởng nhóm sản phẩm / MUST | Khách đăng ký/đăng nhập; không xem được đơn người khác; SRC-C-001 |
| BREQ-CAT-001 | trình bày sản phẩm có thể bán và biến thể chính xác, gồm size/màu nếu áp dụng | BP-01 → OBJ-01,03 | Chủ danh mục / MUST | Khách phân biệt được biến thể đã chọn; SRC-C-001, SRC-P-001 |
| BREQ-DISC-001 | giúp khách tìm sản phẩm phù hợp | BP-06 → OBJ-01,05 | Trưởng nhóm sản phẩm / MUST | Tìm được hàng qua danh mục/tìm kiếm; SRC-C-001 |
| BREQ-CART-001 | giữ và chỉnh sửa lựa chọn mua trước khi cam kết | BP-02 → OBJ-01 | Trưởng nhóm sản phẩm / MUST | Giỏ thể hiện đúng biến thể và số lượng; SRC-C-001 |
| BREQ-SALES-001 | hoàn tất hành trình mua từ lựa chọn hợp lệ đến kết quả nhận/từ chối đơn rõ ràng | BP-02 → OBJ-01,02 | Trưởng nhóm sản phẩm / MUST | Khách biết kết quả và mã tham chiếu nếu nhận đơn; SRC-C-001 |
| BREQ-PRICE-001 | áp dụng giá bán rõ ràng khi chấp nhận giao dịch | BP-01 → OBJ-03 | Chủ thương mại / MUST | Đơn đã nhận lưu số tiền khách đồng ý; SRC-P-001 |
| BREQ-INV-001 | kiểm soát số có thể bán theo biến thể và cập nhật khi đơn thay đổi | BP-01,02 → OBJ-03 | Vận hành / MUST | Tổng cam kết cạnh tranh không vượt nguồn hàng hợp lệ; SRC-C-001 |
| BREQ-ORD-001 | ngăn đơn ngoài ý muốn khi một ý định mua được gửi lại | BP-02 → OBJ-02 | Trưởng nhóm sản phẩm / MUST | Gửi lại cho cùng kết quả đã biết hoặc từ chối an toàn; SRC-P-001 |
| BREQ-PAY-001 | phân biệt nhận đơn, trạng thái thanh toán và việc thực thu tiền | BP-02 → OBJ-02 | Chủ thương mại / MUST | Mô phỏng lỗi và COD không bị tính nhầm là đã thu tiền; SRC-C-001 |
| BREQ-TRACK-001 | cho khách được phép xem tiến độ đơn có ý nghĩa | BP-02 → OBJ-01 | Vận hành / MUST | Khách xem được trạng thái đơn của mình; SRC-C-001 |
| BREQ-NOT-001 | thông báo đơn đã nhận mà lỗi gửi không làm mất hiệu lực đơn | BP-03 → OBJ-04 | Vận hành / MUST | Đơn hợp lệ còn nguyên khi thông báo thất bại; SRC-C-001 |
| BREQ-OPS-001 | cho nhân viên có quyền quản lý danh mục, đơn và xem báo cáo tối thiểu | BP-04 → OBJ-07 | Quản trị viên / MUST | Làm được thao tác quản trị và báo cáo cơ bản; SRC-C-001 |
| BREQ-SEC-001 | giới hạn thông tin khách/giao dịch theo vai trò được phép | BP-02 → OBJ-01 | Quản trị viên / MUST | Người không có quyền không đọc được đơn người khác; SRC-P-003 |
| BREQ-REL-001 | phát hiện, xử lý và phục hồi gián đoạn bán hàng hoặc thay đổi có kiểm soát | BP-04,05 → OBJ-07,08 | Trưởng nhóm dự án / MUST | Có bằng chứng sự cố và phục hồi để rà soát; SRC-C-002 |
| BREQ-CAP-001 | duy trì hành trình xem và mua trong mức tăng nhu cầu đã thống nhất | BP-06 → OBJ-05,06 | Trưởng nhóm sản phẩm / MUST | Tình huống đỉnh tải được định nghĩa và đo sau; SRC-C-001 |

## 7. Năng lực và mô hình vận hành mục tiêu

[Bản đồ năng lực](business-capability-map.md) nhóm quản lý danh tính, tìm hàng, giỏ, giá, tồn kho, đơn, thanh toán, giao hàng, thông báo và vận hành. Chúng là **năng lực kinh doanh**, không phải danh sách dịch vụ phần mềm. [Quy trình To-Be](business-processes.md) mô tả bàn giao giữa người phụ trách danh mục/tồn kho và hành trình khách tìm → chọn → đặt → theo dõi. Thanh toán và thông báo có đường xử lý ngoại lệ riêng. [SRC-C-001]

## 8. Phạm vi, ràng buộc và chỉ số thành công

[Phạm vi chuẩn](../00-project/scope-and-assumptions.md) phân loại MUST/SHOULD/COULD/OUT. Chín use case học phần là MUST ở mức nghiệp vụ. Đổi/trả, khuyến mại và mua không cần tài khoản chưa chốt; thu tiền thật và ERP/POS đầy đủ ngoài MVP. Object storage cho ảnh, thông báo độc lập và xử lý thanh toán lặp là ràng buộc kỹ thuật của học phần cần chuyển sang SRS/kiến trúc, không phải quyết định chọn nhà cung cấp. [SRC-C-001, SRC-C-002]

| Chỉ số / định nghĩa | Số nền | Mục tiêu / người đo |
|---|---|---|
| Tỷ lệ hoàn tất mua: ý định hợp lệ được nhận / ý định hợp lệ đã bắt đầu | Chưa có | Mục tiêu chưa chốt; trưởng nhóm sản phẩm xác định nhóm thử |
| Số đơn ngoài ý muốn cho cùng ý định mua | Chưa có | Đề xuất bằng 0 trong tình huống kiểm soát; QA định nghĩa ý định và đo |
| Số lần bán vượt: lượng đã cam kết lớn hơn nguồn hợp lệ | Chưa có | Đề xuất bằng 0 trong tình huống kiểm soát; vận hành và QA |
| Đọc đúng trạng thái đơn: lượt xem có quyền hiển thị trạng thái đã thống nhất | Chưa có | Mục tiêu chưa chốt; vận hành |
| Theo dõi thông báo: đơn đã nhận có kết quả gửi hoặc việc cần xử lý | Chưa có | Mục tiêu chưa chốt; vận hành |
| Khả năng xem và đặt hàng ở đỉnh tải | Chưa có | Chốt chỉ tiêu định lượng ở giai đoạn tải/NFR; QA |
| Thời gian phát hiện và phục hồi sự cố | Chưa có | Chốt chỉ tiêu ở NFR/vận hành; trưởng nhóm dự án |

Không chỉ số nào ở đây là kết quả thực tế của doanh nghiệp tham chiếu. Các số tải và phục hồi cũ trong SRC-P-001/002 chỉ là mục tiêu thử nghiệm đề xuất.

## 9. Rủi ro, giả định và phụ thuộc

ASM-001/002 xác định doanh nghiệp giả định; ASM-003 ngăn suy diễn dữ liệu nội bộ từ trang công khai. OPEN-STOCK-001, OPEN-PRICE-001 và OPEN-RETRY-001 chặn đặc tả chi tiết quy tắc nhận đơn. OPEN-POLICY-001, OPEN-PROMO-001, OPEN-GUEST-001 và OPEN-REPORT-001 chặn các ranh giới tùy chọn. Quyền dùng ảnh/dữ liệu là OPEN-ASSET-001. Người phụ trách và cách kiểm chứng ở [sổ nguồn](../00-project/source-and-assumption-register.md).

## 10. Truy vết và độ phủ đề bài

| BP | OBJ | BREQ | CAP | PROC | RULE / câu hỏi |
|---|---|---|---|---|---|
| BP-01 | OBJ-01,03 | BREQ-CAT-001, BREQ-PRICE-001, BREQ-INV-001 | CAP-CAT-001, CAP-PRICE-001, CAP-INV-001 | PROC-CAT-001, PROC-INV-001 | RULE-CAT-001, RULE-PRICE-001, RULE-INV-001 |
| BP-02 | OBJ-01,02,03 | BREQ-CART-001, BREQ-SALES-001, BREQ-ORD-001, BREQ-PAY-001 | CAP-CART-001, CAP-ORD-001, CAP-PAY-001 | PROC-CART-001, PROC-ORD-001, PROC-PAY-001 | RULE-ORD-001, RULE-PAY-001 |
| BP-03 | OBJ-04 | BREQ-NOT-001 | CAP-NOT-001 | PROC-NOT-001 | RULE-NOT-001 |
| BP-04 | OBJ-07,08 | BREQ-OPS-001, BREQ-REL-001 | CAP-ADMIN-001, CAP-REPORT-001 | PROC-REPORT-001 | RULE-REPORT-001; chỉ tiêu vận hành sẽ chốt sau |
| BP-05 | OBJ-07,08 | BREQ-REL-001 | CAP-ADMIN-001 | PROC-REPORT-001 | Chính sách vận hành sẽ chốt sau |
| BP-06 | OBJ-05,06 | BREQ-DISC-001, BREQ-CAP-001 | CAP-DISC-001, CAP-CART-001 | PROC-SALES-001, PROC-ORD-001 | Ngưỡng tải sẽ chốt sau |

| Use case bắt buộc của Project 1 | Yêu cầu nghiệp vụ bao phủ |
|---|---|
| 1 Đăng ký/đăng nhập | BREQ-IDENT-001; CAP-IDENT-001 |
| 2 Danh mục/tìm kiếm | BREQ-CAT-001, BREQ-DISC-001 |
| 3 Giỏ hàng | BREQ-CART-001 |
| 4 Checkout/tạo đơn | BREQ-SALES-001, BREQ-ORD-001 |
| 5 Mô phỏng/tích hợp thanh toán | BREQ-PAY-001 |
| 6 Cập nhật tồn kho | BREQ-INV-001 |
| 7 Trạng thái đơn | BREQ-TRACK-001 |
| 8 Thông báo | BREQ-NOT-001 |
| 9 Quản trị/báo cáo cơ bản | BREQ-OPS-001 |

## 11. Rà soát và lịch sử thay đổi

Chưa có tên người, ngày hoặc chữ ký phê duyệt. Danh sách cần rà: chín use case; ý nghĩa biến thể và tồn kho; quyết định gửi lại/giá; định nghĩa KPI; giới hạn phạm vi; quyền sử dụng tài sản; mọi liên kết trong bảng truy vết. **Cổng rà soát: chưa đạt đầy đủ**, chờ quyết định chính sách và rà soát của người phụ trách. Tên mốc Business Baseline v1.0 chỉ được dùng khi cổng thật sự được thông qua; tài liệu này vẫn là Draft v0.1.0.

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Lập bản nháp nghiệp vụ và mã truy vết; giữ nghĩa BP/OBJ cũ; ghi quyết định mở. |
