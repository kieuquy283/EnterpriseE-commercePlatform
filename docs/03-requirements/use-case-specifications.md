---
document_id: UC-SPEC-01
version: 0.1.0
status: Draft — upstream pending
owner: Phân tích yêu cầu (chưa phân công)
reviewer: QA và đại diện nghiệp vụ (chưa xác định)
last_updated: 2026-11-15
source_baseline: SRS-01, BRD-01, ACT-GOAL-01 Draft; Topics trang 4
---

# Đặc tả use case và tiêu chí chấp nhận

Các mã `P1-UC01..09` tương ứng đúng 9 use case của Topics trang 4; `UC-01..08` trong SRS cũ là bộ tình huống lịch sử khác. Các bước dưới đây là hành vi đề xuất, chưa phải thử nghiệm đã chạy. [SRS](SRS.md) định nghĩa FR; [hành trình](../02-users/user-journeys.md) cho bối cảnh trước/sau. Mỗi UC có điều kiện, bảo đảm tối thiểu khi lỗi, luồng chính và nhánh ngoại lệ; chi tiết quyền/chính sách đang mở ghi rõ.

## P1-UC01 — Đăng ký và đăng nhập

- **Actor/mục tiêu:** ACT-CUST, GOAL-CUST-006; hỗ trợ ACT-ADMIN khi phân quyền nội bộ. BREQ-IDENT-001, RULE-ACCESS-001; FR-AUTH-01..04; J-01..03.
- **Kích hoạt/tiền điều kiện:** Người dùng yêu cầu tạo tài khoản hoặc vào tài nguyên riêng; đã có hoặc chưa có định danh hợp lệ.
- **Luồng chính:** (1) Khách cung cấp thông tin tối thiểu. (2) Hệ thống kiểm tra hình thức và trùng lặp. (3) Xác minh thông tin đăng nhập. (4) Chỉ sau xác minh mới cấp ngữ cảnh quyền. (5) Đăng xuất kết thúc quyền truy cập.
- **Nhánh/lỗi:** Email sai/trùng hoặc bí mật sai → từ chối không lộ tài khoản/bí mật; quyền Staff/Admin không được sinh từ tài khoản Customer. Guest xem hàng công khai; guest checkout/tra đơn chờ OPEN-USR-001/002.
- **Hậu điều kiện:** Có định danh hợp lệ hoặc không thay đổi quyền; thao tác nhạy cảm có dấu vết phù hợp. **AT-09:** email mới hợp lệ đăng ký được, email trùng/sai bị từ chối; đăng xuất không còn truy cập tài nguyên riêng.

## P1-UC02 — Danh mục và tìm kiếm

- **Actor/mục tiêu:** ACT-CUST, GOAL-CUST-001/002; BREQ-CAT-001, BREQ-DISC-001, RULE-CAT-001/PRICE-001; FR-CAT-01..05; J-01.
- **Tiền điều kiện:** Có đề nghị bán được công bố; truy cập công khai được phép.
- **Luồng chính:** Khách duyệt/tìm, xem kết quả phân trang, mở sản phẩm, xác định biến thể size/màu, giá VND và tình trạng có thể mua.
- **Nhánh/lỗi:** Không kết quả → trạng thái rỗng rõ; SKU không còn bán → không cho mua; dữ liệu tìm kiếm chậm cập nhật → checkout kiểm lại nguồn có thẩm quyền.
- **Hậu điều kiện:** Chỉ biến thể hợp lệ được chọn. **AT-11:** kết quả có/không có từ khóa, phân trang, size/màu và giá đối chiếu dữ liệu chào bán; sản phẩm ngừng bán không qua được bước mua.

## P1-UC03 — Giỏ hàng

- **Actor/mục tiêu:** ACT-CUST, GOAL-CUST-003; BREQ-CART-001, RULE-CAT-001/PRICE-001; FR-CART-01..04; J-02.
- **Tiền điều kiện:** Có biến thể xác định và ngữ cảnh giỏ hợp lệ.
- **Luồng chính:** Khách tạo/tiếp tục giỏ, thêm biến thể, chỉnh số lượng, xóa dòng, xem tiền từng dòng và tổng dự kiến.
- **Nhánh/lỗi:** Số lượng không dương/không nguyên, SKU hết bán hoặc giỏ không thuộc khách → từ chối mà không tạo dòng/đơn sai; giá thay đổi phải kiểm lại khi checkout.
- **Hậu điều kiện:** Giỏ nhất quán, còn chỉnh được. **AT-12:** thêm 1, đổi 2, xóa; thử SKU/số lượng sai; tổng phản ánh đúng giá có thẩm quyền.

## P1-UC04 — Checkout và tạo đơn

- **Actor/mục tiêu:** ACT-CUST, GOAL-CUST-004; BREQ-SALES-001/ORD-001, RULE-ORD-001/002, RULE-INV-001; FR-CHK-01..04, FR-INV-01/02; J-02.
- **Tiền điều kiện:** Giỏ có hàng, thông tin liên hệ/địa chỉ/phương án giao hợp lệ; ý định mua có thể phân biệt với ý định khác.
- **Luồng chính:** (1) Khách cung cấp dữ liệu giao nhận. (2) Hệ thống kiểm lại SKU, giá, quyền và phương án thanh toán. (3) Xác định kết quả thanh toán cần thiết. (4) Kiểm tra/cam kết tồn và nhận đơn theo quy tắc. (5) Trả mã đơn cùng trạng thái có thể đọc lại.
- **Nhánh/lỗi:** Thiếu địa chỉ, hết hàng, giá đổi, phương án sai → nêu nguyên nhân, không xác nhận giả. Timeout sau khi nhận đơn → tra kết quả cùng ý định trước khi gửi lại. Hai yêu cầu đồng thời cùng ý định → tối đa một đơn. Hai khách tranh SKU cuối → không vượt tồn. Chính sách giữ/trả hàng chờ OPEN-STOCK-001.
- **Hậu điều kiện:** Đơn nhận có mã, dòng/giá/tiền/trạng thái đúng; khi từ chối không có đơn hợp lệ ngoài ý muốn. **AT-01** đối chiếu đơn và tồn; **AT-03** gửi lặp; **AT-13** dữ liệu giao nhận sai; **AT-15** cạnh tranh SKU cuối.

## P1-UC05 — Thanh toán mô phỏng/tích hợp

- **Actor/mục tiêu:** ACT-CUST, GOAL-CUST-004; ACT-SYSTEM là bên tham gia; BREQ-PAY-001, RULE-PAY-001/002; FR-PAY-01..05; J-02.
- **Tiền điều kiện:** Phương án thanh toán hợp lệ cho môi trường thử; không có thu tiền thật trong demo.
- **Luồng chính:** Khách chọn COD hoặc mô phỏng; hệ thống ghi riêng kết quả thanh toán và kết quả đơn; COD hiển thị chưa thu.
- **Nhánh/lỗi:** Mô phỏng thất bại → không báo đã thu/đơn thành công sai; callback hoặc yêu cầu lặp → không thêm tác dụng phụ; timeout → trạng thái chưa rõ và đối soát. Hoàn tiền thật ngoài phạm vi.
- **Hậu điều kiện:** Trạng thái tiền phân biệt với trạng thái đơn. **AT-02** mô phỏng lỗi không tạo thành công giả; **AT-14** COD chưa thu, mô phỏng thành công/thất bại được ghi đúng.

## P1-UC06 — Cập nhật tồn kho

- **Actor/mục tiêu:** ACT-STAFF/ADMIN, GOAL-STAFF-003, GOAL-ADMIN-002; đơn của Customer là nguồn yêu cầu cam kết; BREQ-INV-001, RULE-INV-001; FR-INV-01..03, FR-ADM-01; J-02/J-04.
- **Tiền điều kiện:** SKU và lượng hiện có được xác định; người sửa tay có quyền phù hợp.
- **Luồng chính:** Kiểm tra số có thể bán, cam kết cho đơn được nhận, ghi nguồn thay đổi; Staff/Admin có quyền cập nhật đúng phạm vi.
- **Nhánh/lỗi:** Hai khách cùng mua đơn vị cuối → chỉ một cam kết; điều chỉnh ngoài quyền → từ chối; hủy/giao và thời điểm trả hàng chờ OPEN-STOCK-001.
- **Hậu điều kiện:** Không bán vượt, số liệu đối chiếu được. **AT-15** tranh chấp tồn; **AT-16** thử chuyển trạng thái/điều chỉnh có và không có quyền.

## P1-UC07 — Theo dõi trạng thái đơn

- **Actor/mục tiêu:** ACT-CUST/STAFF, GOAL-CUST-005, GOAL-STAFF-001/002; BREQ-TRACK-001, RULE-FUL-001/ACCESS-001; FR-ORD-01..03; J-03.
- **Tiền điều kiện:** Đơn đã được nhận; người xem chứng minh quyền đối với đơn.
- **Luồng chính:** Khách mở danh sách/chi tiết đơn của mình; Staff xem đơn được giao, ghi bước xử lý hợp lệ; trạng thái khách thấy được cập nhật.
- **Nhánh/lỗi:** Customer A mở đơn B → từ chối không lộ chi tiết; Staff nhảy trạng thái/vượt quyền → từ chối; bộ trạng thái chờ OPEN-FUL-001.
- **Hậu điều kiện:** Không có thay đổi trái phép. **AT-04** cô lập A/B; **AT-17** đọc đơn/trạng thái và thử bước nhảy không hợp lệ.

## P1-UC08 — Thông báo khách hàng

- **Actor/mục tiêu:** ACT-SYSTEM phục vụ ACT-CUST/GOAL-CUST-005; Staff theo dõi lỗi; BREQ-NOT-001, RULE-NOT-001/002; FR-NOT-01..03; J-02/J-03.
- **Tiền điều kiện:** Đơn đã được nhận hoặc có chuyển trạng thái đơn/giao hợp lệ được phép công bố; kênh/liên hệ được phép theo OPEN-USR-009.
- **Luồng chính:** (1) Tạo việc riêng khỏi thao tác nhận đơn/cập nhật trạng thái. (2) Tạo thông báo cho xác nhận đơn hoặc mốc trạng thái đủ điều kiện; nội dung chỉ phản ánh sự kiện đã xảy ra và mã đơn/trạng thái cần thiết. (3) Gửi qua kênh được duyệt, ghi kết quả và cho phép Staff theo dõi việc lỗi. Khách vẫn tra trạng thái đơn từ nguồn chuẩn.
- **Nhánh/lỗi:** Provider lỗi/timeout → quyết định thử lại hữu hạn, ghi lỗi; đơn và trạng thái không đổi. Sự kiện trùng hoặc cũ không tạo thông báo logic trùng/sai thứ tự. Chuyển trạng thái không đủ điều kiện công bố không phát thông báo; không gọi đơn “đã giao” nếu chưa có chứng cứ.
- **Hậu điều kiện:** Mỗi sự kiện đủ điều kiện có kết quả gửi hoặc việc cần xử lý; trạng thái nguồn vẫn có thể tra cứu. **AT-05:** xác nhận và cập nhật trạng thái, phát lại cùng sự kiện, gửi trạng thái cũ, provider lỗi rồi phục hồi; xác nhận không trùng/sai thứ tự, đơn và trạng thái không đổi, lịch sử thử/kết quả đọc được. Danh sách mốc cụ thể chờ OPEN-USR-006/OPEN-FUL-001; kênh chờ OPEN-USR-009.

## P1-UC09 — Quản trị và báo cáo cơ bản

- **Actor/mục tiêu:** ACT-ADMIN/STAFF theo quyền, GOAL-ADMIN-001/003, GOAL-STAFF-001; BREQ-OPS-001, RULE-REPORT-001; FR-ADM-01/02, FR-AUTH-04; J-04.
- **Tiền điều kiện:** Danh tính đã xác minh và quyền được cấp.
- **Luồng chính:** Admin quản lý sản phẩm/biến thể, điều chỉnh tồn có dấu vết, xem số đơn theo trạng thái và ngoại lệ; Staff chỉ xem phần được giao.
- **Nhánh/lỗi:** Khách/Staff thiếu quyền → từ chối; báo cáo không gộp đơn đặt, thu tiền, đã giao; chỉ số chi tiết chờ OPEN-REPORT-001.
- **Hậu điều kiện:** Dữ liệu thay đổi có thể truy nguyên; không lộ PII ngoài nhiệm vụ. **AT-10** kiểm quyền; **AT-18** kiểm công bố SKU và đối chiếu báo cáo mẫu.

## Bộ kiểm tra chéo và trạng thái

| Mã | Tình huống / điều cần đối chiếu | Dấu vết lịch sử |
|---|---|---|
| AT-01 | Đơn thành công: mã, dòng, VND, tồn cam kết, đọc lại | Giữ AT-01 |
| AT-02 | Mô phỏng lỗi: không xác nhận giả, tiền/tồn đúng | Giữ AT-02; chi tiết giữ hàng chờ policy |
| AT-03 | Hai lần gửi cùng ý định và gửi lại sau timeout: không đơn thứ hai | Giữ AT-03 |
| AT-04 | Customer A không đọc đơn B; guest không vào Admin | Giữ AT-04 |
| AT-05 | Xác nhận đơn và các mốc trạng thái đủ điều kiện; phát lại cùng sự kiện/đến sai thứ tự; provider lỗi rồi phục hồi; đơn và trạng thái không đổi, không gửi trùng/sai mốc | Mở rộng AT-05 |
| AT-06 | Mất cache/tìm kiếm: chỉ fallback có định nghĩa, không xác nhận đơn giả | Giữ nghĩa AT-06, bỏ phụ thuộc sản phẩm cache cụ thể |
| AT-07 | Đo tải có dữ liệu/môi trường rõ; so với mục tiêu *đã duyệt* | Giữ AT-07; chưa chạy |
| AT-08 | Khôi phục bản sao và đo dữ liệu mất/thời gian | Giữ AT-08; chưa chạy |
| AT-09..18 | Kiểm tra bổ sung theo từng UC ở trên | Mới, Draft |
| AT-19 | Đối chiếu kiểm tra mã/build, phiên bản môi trường thử, phát hành lại và quay lại bản trước; không mất dữ liệu đơn | Mới, P3/P4, chưa chạy |
| AT-20 | Gây lỗi dịch vụ, checkout, job và backup thử; đối chiếu traffic/latency/error/saturation, correlation, cảnh báo và không lộ PII | Mới, P4, chưa chạy |

Chưa có biên bản review hay kết quả AT. Quyết định guest, Staff/Admin, tồn khi hủy, giá đổi, danh sách mốc đơn/giao được phép thông báo, kênh thông báo và chỉ số báo cáo vẫn OPEN; người rà cần chốt trước khi coi use case hoàn tất.
