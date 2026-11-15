---
document_id: SCOPE-01
title: Phạm vi và giả định
version: 0.1.0
status: Draft
owner: Trưởng nhóm dự án (chưa phân công)
reviewer: Trưởng nhóm phân tích nghiệp vụ (chưa phân công)
last_updated: 2026-11-15
source_of_truth: true
related_documents:
  - project-charter.md
  - source-and-assumption-register.md
  - ../01-business/BRD.md
---

# Phạm vi và giả định

Đây là ranh giới nghiệp vụ **đề xuất** cho doanh nghiệp giả định. MUST chỉ năng lực học phần yêu cầu, **không** có nghĩa chức năng đã được triển khai. Các mã M-01..13 và O-01..06 vẫn có trong tài liệu cũ tại local `docs/02_Project_Scope_and_Assumptions.md`; bảng dưới đối chiếu mà không thay đổi ý nghĩa lịch sử của chúng. [SRC-C-001, SRC-P-002]

| Ưu tiên | Phạm vi nghiệp vụ | Đối chiếu đề bài / mã cũ |
|---|---|---|
| MUST | Đăng ký, đăng nhập và truy cập đúng vai trò | UC1; M-01 |
| MUST | Công bố thông tin sản phẩm và biến thể; xem danh mục, tìm kiếm | UC2; M-02, M-03 |
| MUST | Quản lý giỏ hàng và chuẩn bị đặt hàng | UC3; M-04 |
| MUST | Chấp nhận đơn hợp lệ, tách kết quả đơn và kết quả thanh toán | UC4–5; M-05, M-06 |
| MUST | Cập nhật và kiểm soát số lượng có thể bán theo biến thể | UC6; M-07 |
| MUST | Hiển thị trạng thái đơn và hỗ trợ bàn giao xử lý cơ bản | UC7; M-08 |
| MUST | Thông báo về đơn đã được chấp nhận; lỗi gửi không làm sai đơn | UC8; M-09 |
| MUST | Quản trị và báo cáo cơ bản cho nhân viên có quyền | UC9; M-08 và FR-ADM cũ |
| MUST ở giai đoạn kỹ thuật sau | Năng lực lưu ảnh bằng object storage, tìm kiếm, lưu tạm dữ liệu truy cập nhiều, thông báo bất đồng bộ, xử lý lặp thanh toán; NFR đo được, trình diễn cloud và bằng chứng vận hành | Topics trang 5, 24–26; M-10..13 |
| SHOULD / chờ quyết định | Hướng dẫn chọn size, khuyến mại giới hạn, hỗ trợ đổi hàng, báo cáo sâu hơn | OPEN-PROMO-001, OPEN-POLICY-001 |
| COULD | Gợi ý sản phẩm và nghiên cứu dữ liệu H&M khi đã rõ quyền sử dụng | O-01, O-02 |
| OUT | Thu tiền thật, ERP/POS đầy đủ, sàn nhiều nhà bán, theo dõi hãng vận chuyển thực, AI quy mô lớn | Phạm vi cũ §5; Topics trang 25 |

Mua không cần tài khoản **chưa được quyết định**, không tự xem là bắt buộc hay loại trừ. Mô phỏng thanh toán phù hợp với học phần nhưng không được mô tả là đã thu tiền thật. Theo dõi trạng thái đơn là bắt buộc; không mặc định tích hợp vận chuyển ngoài đời. Object storage cho ảnh là ràng buộc kiến trúc của học phần; chọn nhà cung cấp thuộc giai đoạn đánh giá công nghệ. [SRC-C-001, ASM-004, OPEN-GUEST-001, OPEN-FUL-001]

## Giả định của dự án

| ID | Giả định / giới hạn | Hệ quả và cách xác minh |
|---|---|---|
| ASM-001 / A-01 cũ | Doanh nghiệp thời trang B2C giả định tại Việt Nam, dùng VND | Trưởng nhóm nghiệp vụ rà mô hình; không gán tình huống cho SOMEHOW |
| ASM-002 / A-02 cũ | Một kênh online và một địa điểm tồn kho mẫu | Đại diện vận hành đánh giá có đủ cho MVP không |
| ASM-003 | Không có số liệu doanh thu, traffic hoặc tồn kho nội bộ của SOMEHOW | Mọi số tải phải ghi là mục tiêu thử nghiệm |
| ASM-004 / A-05 cũ | Mô phỏng thanh toán không chuyển tiền; COD chưa phải đã thu tiền lúc nhận đơn | Đối chiếu cách viết trong SRS và demo |
| A-03, A-06 cũ | Một máy chủ, Redis và worker là giả định triển khai lịch sử | Chỉ đánh giá lại sau kiến trúc logic và NFR |
| A-04, A-07, A-08 cũ | 30 yêu cầu xem/giây, 3 yêu cầu đặt/giây, khôi phục 60/120 phút và ngân sách chưa chốt là mục tiêu cũ | Xác minh ở giai đoạn workload/NFR; không ghi là kết quả đo |
| A-09, A-10 cũ | Quyền dùng tài sản và trạng thái nhánh kiểm thử cũ cần kiểm lại | Người phụ trách dữ liệu và QA xác minh trước demo công khai |

## Ràng buộc và phụ thuộc

Quy mô nhóm 5–7 người và định hướng MVP hướng tới vận hành thực tế đến từ đề bài. Kế hoạch Tuần 4–13 được giữ riêng như lịch sử giao việc, chờ thống nhất lịch. Không tài liệu nghiệp vụ nào chốt framework, cơ sở dữ liệu, nhà cung cấp cloud hay mô hình triển khai. [SRC-C-002, SRC-P-004]

Các quyết định về đổi/trả, khuyến mại, mua không cần tài khoản, trạng thái đơn tối thiểu, chỉ số báo cáo, người duyệt chính sách, ngân sách tháng và quyền tài sản nằm trong [sổ nguồn và giả định](source-and-assumption-register.md). Mỗi thay đổi phạm vi cần có người phụ trách, lý do, ảnh hưởng lên chín use case và biên bản rà soát.

## Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Phân loại lại phạm vi cũ theo nghĩa vụ học phần và lựa chọn nghiệp vụ tạm thời; giữ mã lịch sử. |
