---
document_id: RULES-01
title: Quy tắc nghiệp vụ
version: 0.1.0
status: Draft
owner: Người phân tích miền nghiệp vụ (chưa phân công)
reviewer: Người phụ trách chính sách kinh doanh (chưa xác định)
last_updated: 2026-11-15
source_of_truth: true
related_documents:
  - BRD.md
  - business-processes.md
  - ../00-project/source-and-assumption-register.md
---

# Quy tắc nghiệp vụ

Đây là các quy tắc **PROJECT-PROPOSED** cho doanh nghiệp giả định, không phải chính sách của SOMEHOW. Chưa có quy tắc nào Approved. Mã `RULE-*` chỉ quy tắc nghiệp vụ; mã `BR-*` trong SRS cũ tại local `docs/03_Software_Requirements_Specification.md` chỉ được giữ để đối chiếu. Vai trò phụ trách chính sách cần được xác nhận theo OPEN-REVIEW-001. [SRC-P-003]

| Mã / loại | Quy tắc đề xuất và lý do | Áp dụng; vai trò phụ trách | Cách kiểm chứng và ngoại lệ | Nguồn / đối chiếu mã cũ |
|---|---|---|---|---|
| RULE-CAT-001 / Kiểm tra hợp lệ | Mỗi dòng hàng được mua phải chỉ ra một biến thể đang bán, gồm size/màu khi áp dụng, để món hàng cam kết không mơ hồ. | PROC-CAT-001, PROC-SALES-001, PROC-CART-001; Chủ danh mục | Thử hàng đang bán, ngừng bán và không có size; quy ước SKU chờ OPEN-SKU-001 | SRC-C-001, SRC-P-003; BR-02/03 |
| RULE-PRICE-001 / Tính toán | Đơn được chấp nhận phải ghi giá và điều kiện khách đã đồng ý tại thời điểm quyết định nhận đơn; giỏ chưa được nhận không phải cam kết giá. | PROC-CAT-001, PROC-ORD-001; Chủ thương mại | Giá đổi giữa checkout phải có cách xin xác nhận lại; thuế/giao/khuyến mại chờ OPEN-PRICE-001/OPEN-PROMO-001 | SRC-P-001, SRC-P-003; không sao chép quy tắc gắn Medusa |
| RULE-INV-001 / Giới hạn | Tổng số lượng đã cam kết cho đơn được nhận của một biến thể không được vượt số có thể bán hợp lệ. | PROC-INV-001, PROC-ORD-001; Vận hành | Thử hai người mua món cuối; cách giữ/trả chờ OPEN-STOCK-001 | SRC-C-001, SRC-P-003; BR-09 |
| RULE-ORD-001 / Giới hạn | Gửi lại cùng một ý định mua không được tạo thêm đơn được nhận ngoài ý muốn; lần mua mới có chủ đích là ý định khác. | PROC-ORD-001; Trưởng nhóm sản phẩm | Thử gửi lại, timeout và cùng lúc; cách nhận diện ý định chờ OPEN-RETRY-001 | SRC-P-001, SRC-P-003; BR-08 |
| RULE-ORD-002 / Chuyển trạng thái | Khách chỉ nhận mã đơn đã được chấp nhận khi có kết quả đơn hợp lệ; từ chối phải phân biệt được với kết quả chưa rõ. | PROC-ORD-001; Vận hành | Thử mô phỏng lỗi và phản hồi chậm; bằng chứng kỹ thuật thuộc SRS | SRC-P-003; diễn đạt nghiệp vụ của BR-04/07 |
| RULE-PAY-001 / Chuyển trạng thái | Việc nhận đơn, cho phép/thu tiền và giao hàng là các trạng thái nghiệp vụ riêng. | PROC-PAY-001, PROC-FUL-001; Chủ thương mại | So sánh đơn đã nhận/chưa thu, thanh toán lỗi, đã thu và đã giao | SRC-P-003; BR-05 |
| RULE-PAY-002 / Kiểm tra hợp lệ | Chọn COD hoặc nhận kết quả cho phép từ công cụ mô phỏng không chứng minh đã thu tiền. | PROC-PAY-001; Chủ thương mại | Báo cáo COD là chưa thu đến khi có xác nhận thu; mô phỏng không chuyển tiền | SRC-P-003, ASM-004; BR-05/06 |
| RULE-NOT-001 / Ngoại lệ | Lỗi gửi thông báo cho khách không thu hồi một đơn đã được chấp nhận hợp lệ; việc liên lạc lại phải được theo dõi. | PROC-NOT-001, PROC-ORD-001; Vận hành | Thử nhà cung cấp không sẵn sàng/gửi lặp; cam kết và số lần thử xác định sau | SRC-C-001, SRC-P-003; BR-10 |
| RULE-ACCESS-001 / Phân quyền | Khách chỉ xem đơn của mình; nhân viên được cấp quyền chỉ xem/sửa theo nhiệm vụ. | PROC-FUL-001 và xem trạng thái; Quản trị viên | Thử truy cập chéo khách; danh tính khách vãng lai chờ OPEN-GUEST-001 | SRC-P-003; BR-11 |
| RULE-FUL-001 / Chuyển trạng thái | Tiến độ đơn chỉ được thay đổi theo các bước nghiệp vụ đã thống nhất, bởi vai trò có quyền. | PROC-FUL-001; Vận hành | Từ chối bước nhảy hoặc chuyển sai; bộ trạng thái chờ OPEN-FUL-001 | SRC-C-001, SRC-P-003 |
| RULE-REPORT-001 / Tính toán | Báo cáo cơ bản phải phân biệt đơn đã đặt, đã thu tiền, đã giao và đã hủy để không nhầm các chỉ số bán hàng. | PROC-REPORT-001; Quản trị viên | Đối chiếu đơn mẫu ở từng trạng thái; bộ chỉ số chờ OPEN-REPORT-001 | SRC-C-001, SRC-P-003 |
| RULE-RET-001 / Ngoại lệ, **còn mở** | Chỉ có thể quyết định nhận yêu cầu đổi/trả theo chính sách riêng đã được chốt cho dự án. Chưa quy định thời hạn hay phí. | PROC-RET-001; Vận hành | Không triển khai một số ngày cố định khi OPEN-POLICY-001 chưa giải quyết | SRC-E-002, SRC-E-003; không nhận quy tắc cũ làm mặc định |

RULE-RET-001 chỉ đánh dấu **ranh giới quyết định**, chưa tạo quyền đổi/trả có hiệu lực. Trang điều kiện giao dịch chung của SOMEHOW nêu 7 ngày, còn trang chính sách đổi hàng nêu 10 ngày; không giá trị nào tự áp dụng cho doanh nghiệp giả định. [SRC-E-002, SRC-E-003]

## Mâu thuẫn và quy tắc cũ không chuyển nguyên trạng

| Câu trong tài liệu cũ | Cách xử lý |
|---|---|
| BR-01: nền tảng thương mại cụ thể quyết định giá/đơn | Ranh giới triển khai lịch sử, không phải bất biến nghiệp vụ. RULE-PRICE-001 và RULE-ORD-002 diễn đạt nhu cầu kinh doanh. |
| BR-04: một kiểu phản hồi kỹ thuật chứng minh đặt hàng thành công | Bằng chứng kỹ thuật thuộc SRS sau; RULE-ORD-002 định nghĩa kết quả khách cần thấy. |
| BR-12: cơ chế lưu ảnh | Chuyển ràng buộc lưu ảnh của học phần sang kiến trúc/NFR, không biến thành chính sách bán hàng. |
| BR-13–15: dữ liệu mẫu, bí mật và quy trình triển khai | Thuộc quản trị dữ liệu và kiểm soát kỹ thuật giai đoạn sau, không phải quy tắc bán hàng. |

Thanh toán lỗi và việc nhận đơn phải được đặc tả cùng nhau ở giai đoạn SRS; không quy tắc nào ở đây mặc định hành vi hoàn tiền. Thời điểm trả tồn kho sau hủy, thứ tự áp dụng khuyến mại, quyền của khách vãng lai và bảng chuyển trạng thái còn mở. Chỉ có thể duyệt quy tắc sau khi người phụ trách chính sách thực sự ghi ngày và kết quả rà soát. **Trạng thái hiện tại: Draft; cổng rà soát chưa đủ.**

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Đề xuất quy tắc độc lập công nghệ và đối chiếu mã BR cũ. |
