<a id="teacher-acceptance-brief--project-1"></a>
# Yêu cầu nghiệm thu của giảng viên — Dự án 1

Nguồn: kỳ vọng giảng viên do nhóm dự án cung cấp trực tiếp ngày 14 tháng 11 năm 2026. Đây là đầu vào nghiệm thu, không phải kết quả đã đạt. [Đặc tả](../README.md) ánh xạ sang cổng triển khai/kiểm thử.

<a id="common-expectations"></a>
## Kỳ vọng chung

MVP hướng vận hành thực tế; kiến trúc rõ và đánh đổi giải thích được; triển khai cloud thật có CI/CD, bảo mật, quan sát và ý thức chi phí; lý giải lựa chọn cloud/provider/công nghệ. Không yêu cầu sản phẩm doanh nghiệp hoàn chỉnh, hàng chục microservice, mọi tính năng, AI phức tạp chưa đánh giá hoặc sao chép kiến trúc công ty lớn.

<a id="business-and-functional-scope"></a>
## Phạm vi nghiệp vụ và chức năng

Thương mại cloud hỗ trợ toàn hành trình mua. Người dùng cốt lõi: khách hàng, nhân viên cửa hàng/vận hành, quản trị viên. Tính năng nâng cao: gợi ý sản phẩm HOẶC trợ lý mua sắm AI; DAYMARK chọn gợi ý sản phẩm.

Ca sử dụng bắt buộc:

1. Đăng ký/đăng nhập.
2. Danh mục và tìm kiếm sản phẩm.
3. Giỏ hàng.
4. Checkout và tạo đơn.
5. Mô phỏng/tích hợp thanh toán.
6. Cập nhật tồn kho.
7. Theo dõi trạng thái đơn.
8. Thông báo khách hàng.
9. Quản trị/báo cáo cơ bản.

<a id="engineering-requirements"></a>
## Yêu cầu kỹ thuật

Tải: duyệt sản phẩm thiên về đọc, checkout giao dịch và đỉnh khuyến mãi.

Kiến trúc: cơ sở dữ liệu đơn giao dịch, tìm kiếm sản phẩm, cache dữ liệu nóng, lưu đối tượng cho nội dung đa phương tiện, thông báo bất đồng bộ và idempotency thanh toán.

Xác định mục tiêu số: RPS/người dùng đồng thời đỉnh, p95 API, độ sẵn sàng, mục tiêu khôi phục, ngân sách cloud tháng. Giảng viên cung cấp nhóm chỉ tiêu, không cho số cụ thể; số của DAYMARK là mục tiêu dự án cần kiểm thử.

Cần trình diễn: tăng giảm theo tải đỉnh mô phỏng, xử lý trùng thanh toán/đơn an toàn, triển khai CI/CD, dashboard giám sát, kiến trúc và ADR.

<a id="shared-lifecycle-deliverables"></a>
## Sản phẩm bàn giao theo vòng đời

| Giai đoạn | Sản phẩm |
| --- | --- |
| P1 Nghiệp vụ và kiến trúc | Vấn đề, bên liên quan, yêu cầu chức năng, NFR số, phân tích tải, kiến trúc cloud ban đầu |
| P2 Ứng dụng, dữ liệu và tích hợp | Kiến trúc thành phần, API, mô hình/quyền sở hữu dữ liệu, đồng bộ/bất đồng bộ và tích hợp |
| P3 Bảo mật và DevOps | Mô hình đe dọa, IAM/truy cập, CI/CD, container, IaC, chiến lược triển khai/quay lui |
| P4 Kỹ thuật vận hành thực tế | Tải/hiệu năng, độ tin cậy/kịch bản lỗi, dashboard, SLI/SLO, năng lực và chi phí |
| P5 Kỹ thuật AI nếu có | Kiến trúc AI, dữ liệu/chỉ số đánh giá, bảo mật/rào chắn, độ trễ và phí token |

Với gợi ý không LLM: mô tả thuật toán/kiến trúc dữ liệu, đánh giá chất lượng/điều kiện hợp lệ và độ trễ/chi phí tài nguyên; phí token ghi N/A. Thêm trợ lý sinh nội dung cần yêu cầu an toàn/đánh giá/chi phí mới.

<a id="architecture-defense-questions"></a>
## Câu hỏi bảo vệ kiến trúc

1. Giải quyết vấn đề nghiệp vụ gì?
2. Giả định tải nào?
3. NFR đo được nào áp dụng?
4. Vì sao chọn kiến trúc này?
5. Vì sao chọn mô hình cơ sở dữ liệu/lưu trữ này?
6. Điều gì xảy ra ở tải 5x hoặc 10x?
7. Khi phụ thuộc lỗi thì sao?
8. Triển khai/quay lui thế nào?
9. Bảo vệ dữ liệu/truy cập ra sao?
10. Biết hệ thống khỏe bằng cách nào?
11. Chi phí bao nhiêu?
12. Nếu dùng AI, chất lượng, an toàn và chi phí thế nào?

Cần một luồng xuyên suốt hoàn chỉnh, cloud thật, quyết định có ý nghĩa, yêu cầu đo được, xử lý lỗi, bảo mật, triển khai tự động, khả năng quan sát và ý thức chi phí. Xây ít hơn nhưng thiết kế, triển khai, đo và bảo vệ tốt.
