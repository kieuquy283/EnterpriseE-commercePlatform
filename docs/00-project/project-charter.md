---
document_id: CHARTER-01
title: Tuyên bố dự án
version: 0.1.0
status: Draft
owner: Trưởng nhóm dự án (chưa phân công)
reviewer: Trưởng nhóm phân tích nghiệp vụ và giảng viên (chưa xác định)
last_updated: 2026-11-15
source_of_truth: true
related_documents:
  - scope-and-assumptions.md
  - source-and-assumption-register.md
  - ../01-business/BRD.md
---

# Tuyên bố dự án

## Mục đích và bối cảnh

Đồ án đề xuất một **sản phẩm khả dụng tối thiểu (MVP) hướng tới vận hành thực tế** cho doanh nghiệp bán lẻ thời trang B2C **giả định** tại Việt Nam. Khách hàng cần hoàn tất hành trình mua hàng; nhân viên và quản trị viên cần thực hiện các công việc bán lẻ thiết yếu. SOMEHOW chỉ là **nguồn tham chiếu kinh doanh công khai**, không phải đơn vị tài trợ hay khách hàng của đồ án. Nhóm không có dữ liệu nội bộ của SOMEHOW về doanh thu, lưu lượng, quy trình, tồn kho hoặc hệ thống. [SRC-C-001, SRC-E-001, ASM-001]

Giá trị kinh doanh dự kiến là giúp thông tin sản phẩm và biến thể, khả năng cung ứng, quyết định nhận đơn, trạng thái thanh toán và liên lạc sau mua nhất quán, đủ để trình diễn và đánh giá. Sáu mã vấn đề lịch sử BP-01..06 được giữ trong [BRD](../01-business/BRD.md). Chúng là **tình huống giả định của dự án**, không phải sự cố được xác minh tại SOMEHOW. [SRC-P-001]

## Kết quả và ranh giới

MVP phải bao phủ chín tình huống sử dụng trong Project 1: đăng ký/đăng nhập; danh mục và tìm kiếm; giỏ hàng; thanh toán và tạo đơn; mô phỏng/tích hợp thanh toán; cập nhật tồn kho; theo dõi trạng thái đơn; thông báo khách hàng; quản trị và báo cáo cơ bản. Học phần còn yêu cầu trình diễn một luồng đầu cuối trên cloud, chỉ tiêu chất lượng đo được, xử lý lỗi, bảo mật, triển khai tự động, khả năng quan sát và nhận thức về chi phí. Đây là **nghĩa vụ bàn giao**, không phải bằng chứng đã hoàn thành. [SRC-C-001, SRC-C-002]

Mô hình tạm thời gồm một kênh bán online, giá VND và một địa điểm tồn kho mẫu. Thu tiền thật, thương mại đa nhà bán, ERP/POS đầy đủ và AI nâng cao nằm ngoài phạm vi ban đầu. Đổi/trả, khuyến mại và mua không cần tài khoản còn chờ quyết định. Danh sách ưu tiên và giả định chuẩn nằm trong [Phạm vi và giả định](scope-and-assumptions.md). [SRC-P-002, ASM-001, ASM-002]

## Quản trị dự án

| Vai trò | Trách nhiệm | Người phụ trách |
|---|---|---|
| Trưởng nhóm dự án | Tiến độ, thay đổi phạm vi và bằng chứng | Chưa phân công |
| Trưởng nhóm phân tích nghiệp vụ/sản phẩm | Yêu cầu nghiệp vụ và thuật ngữ | Chưa phân công |
| Đại diện vận hành | Chính sách đề xuất về đơn, tồn kho và giao hàng | Chưa phân công |
| Người rà soát chất lượng | Truy vết và khả năng kiểm chứng | Chưa phân công |
| Người rà soát kiến trúc | Thiết kế logic và vật lý ở giai đoạn sau | Chưa phân công |
| Giảng viên | Đối chiếu yêu cầu học phần, nếu tham gia | Chưa xác định |

Chỉ thay trạng thái tài liệu thành Reviewed hoặc Approved khi có biên bản rà soát thật. Các quyết định chưa chốt nằm trong [sổ nguồn và giả định](source-and-assumption-register.md). Khi thay đổi yêu cầu, cập nhật BRD trước rồi đối chiếu năng lực, quy trình và quy tắc. Việc chọn công nghệ thuộc giai đoạn đánh giá sau và cần ghi quyết định kèm lý do.

## Mốc và bằng chứng

1. Nền tảng nghiệp vụ: sổ nguồn, BRD, năng lực, quy trình và quy tắc có truy vết; giữ trạng thái Draft cho đến khi được rà soát.
2. Người dùng, SRS, tải công việc và mô hình dữ liệu.
3. Kiến trúc logic và cổng rà soát.
4. Đánh giá công nghệ, thiết kế vật lý, triển khai và trình diễn có số đo trên cloud.

Đề bài mô tả học phần 12 tuần; kế hoạch dự án cũ ghi Tuần 4–13. Cả hai được giữ như nguồn lịch sử; lịch thống nhất là câu hỏi mở. [SRC-C-002, SRC-P-004]

## Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Biên soạn tuyên bố dự án độc lập công nghệ từ tài liệu cũ; giữ nguồn cũ để đối chiếu. |
