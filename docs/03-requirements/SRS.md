---
document_id: SRS-01
version: 0.1.0
status: Draft — upstream pending
owner: Phân tích yêu cầu (chưa phân công)
reviewer: Chủ nghiệp vụ, QA (chưa xác định)
last_updated: 2026-11-15
source_baseline: BRD-01 và ACT-GOAL-01 v0.1.0 Draft; Topics trang 4–5
---

# Đặc tả yêu cầu phần mềm

## 1. Phạm vi và nguồn

Đặc tả này chuyển [BRD](../01-business/BRD.md), [quy tắc nghiệp vụ](../01-business/business-rules.md) và [vai trò/mục tiêu](../02-users/actors-and-user-goals.md) thành hành vi kiểm chứng được. Đây là MVP bán lẻ thời trang B2C giả định, không phải yêu cầu của SOMEHOW. Chín use case của Topics trang 4 là bắt buộc ở mức học phần; khuyến nghị AI, đổi trả, khuyến mại, thanh toán tiền thật và tích hợp ERP/POS không nằm trong lõi đã chốt. Nguồn và giả định theo [sổ nguồn](../00-project/source-and-assumption-register.md). Business và Users chưa được duyệt nên mọi FR dưới đây là **đề xuất**, không phải baseline được phê duyệt. [SRC-C-001, SRC-P-003]

`Khách` = ACT-CUST; `nhân viên` = ACT-STAFF; `quản trị viên` = ACT-ADMIN. `Đơn được nhận` khác `đã thu tiền` và `đã giao`. `Biến thể` xác định hàng bán cụ thể (size/màu nếu có). `Ý định checkout` là một lần khách xác nhận mua với định danh ổn định để đối chiếu gửi lại. Các chính sách còn mở không được hiểu thành quyền đã cấp.

## 2. Danh mục yêu cầu chức năng

Mỗi dòng có đủ **actor · hành động · đầu vào · đầu ra · quy tắc** theo Presentation 1 trang 26. Mức `M` kế thừa MUST của SRS cũ, `S` là SHOULD; trạng thái tất cả là Draft. Cột kiểm tra trỏ tới mã `AT-*` trong [đặc tả use case](use-case-specifications.md). Một kết quả từ chối phải có lý do an toàn và không tạo tác dụng phụ ngoài ý muốn. Cột nguồn nêu BREQ chính; [ma trận truy vết](requirements-traceability.md) nối tiếp tới mục tiêu/journey/UC.

| ID / mức | Actor; hành động | Đầu vào → đầu ra quan sát được | Quy tắc và nguồn | Kiểm tra |
|---|---|---|---|---|
| FR-AUTH-01 M | Khách đăng ký | Email, bí mật xác thực hợp lệ → tài khoản hoặc từ chối | Email hợp lệ/không trùng; không lộ bí mật; BREQ-IDENT-001 | AT-09 |
| FR-AUTH-02 M | Khách đăng nhập/đăng xuất | Thông tin xác thực → phiên hợp lệ hoặc từ chối; đăng xuất hết quyền | Chỉ cấp quyền sau xác minh; BREQ-IDENT-001 | AT-09 |
| FR-AUTH-03 M | Khách xem/sửa dữ liệu của mình | Danh tính, hồ sơ/địa chỉ/đơn → dữ liệu sở hữu hoặc từ chối | RULE-ACCESS-001, BREQ-SEC-001; A không đọc B | AT-04 |
| FR-AUTH-04 M | Staff/Admin thực hiện việc được giao | Danh tính, hành động → kết quả hoặc từ chối | Quyền theo việc được giao; OPEN-USR-003/004; BREQ-SEC-001 | AT-10 |
| FR-CAT-01 M | Khách duyệt danh mục | Tiêu chí/trang → sản phẩm đang bán hoặc kết quả rỗng | Chỉ hàng được công bố; RULE-CAT-001, BREQ-CAT-001 | AT-11 |
| FR-CAT-02 M | Khách xem chi tiết/chọn biến thể | Sản phẩm, size/màu → biến thể, giá, ảnh, khả năng mua hoặc hết hàng | Không tự suy đoán SKU; RULE-CAT-001, BREQ-CAT-001 | AT-11 |
| FR-CAT-03 M | Khách tìm hàng | Từ khóa/trang hợp lệ → kết quả hoặc rỗng/lỗi rõ | Giới hạn đầu vào và phân trang; BREQ-DISC-001 | AT-11 |
| FR-CAT-04 M | Khách xem giá | Biến thể/khu vực → giá VND và tổng tương ứng | Một nguồn giá có thẩm quyền; RULE-PRICE-001 | AT-11, AT-01 |
| FR-CAT-05 S | Khách lọc/sắp xếp | Tiêu chí → tập sản phẩm đúng điều kiện hoặc rỗng | Không giới thiệu hàng không bán; BREQ-DISC-001 | AT-11 |
| FR-CART-01 M | Khách tạo/tiếp tục giỏ | Ngữ cảnh khách/khu vực → giỏ riêng hoặc từ chối | Không lẫn giỏ khác; BREQ-CART-001; guest chờ OPEN-USR-001 | AT-12 |
| FR-CART-02 M | Khách thêm/sửa/xóa dòng | Biến thể, số nguyên dương → giỏ và số lượng mới | SKU hợp lệ; BREQ-CART-001, RULE-CAT-001 | AT-12 |
| FR-CART-03 M | Khách xem tổng dự kiến | Giỏ, phương án giao/thuế nếu biết → tiền theo từng khoản và tổng | Không tự cam kết giá cũ; RULE-PRICE-001 | AT-12 |
| FR-CART-04 M | Khách xử lý giỏ sai | SKU/số lượng không hợp lệ → lỗi cụ thể, giỏ còn nhất quán | Không tạo dòng/đơn sai; RULE-CAT-001 | AT-12 |
| FR-CHK-01 M | Khách cung cấp thông tin đặt hàng | Giỏ, liên hệ, địa chỉ, phương án giao → hợp lệ hoặc chỉ rõ trường sai | Chỉ phương án có hiệu lực; BREQ-SALES-001 | AT-01, AT-13 |
| FR-CHK-02 M | Khách chọn cách thanh toán | Phương án được phép → trạng thái chuẩn bị thanh toán hoặc từ chối | Mô phỏng chỉ trong thử nghiệm; RULE-PAY-001 | AT-01, AT-02 |
| FR-CHK-03 M | Khách hoàn tất checkout | Ý định, giỏ hợp lệ → mã đơn đã nhận hoặc kết quả từ chối/chưa rõ | Chỉ xác nhận khi kết quả đơn bền vững; RULE-ORD-001/002 | AT-01, AT-03 |
| FR-CHK-04 M | Khách nhận kết quả lỗi | Thông tin checkout sai/lỗi → thông báo an toàn và cách tiếp tục | Không hiện xác nhận giả; trạng thái giỏ/giữ hàng theo OPEN-STOCK-001 | AT-02, AT-13 |
| FR-PAY-01 M | Khách chọn COD | Lựa chọn COD → đơn ghi chưa thu tiền | COD không đồng nghĩa đã thu; RULE-PAY-001 | AT-14 |
| FR-PAY-02 M | QA/khách demo dùng mô phỏng | Kết quả mô phỏng thành công/thất bại → trạng thái tương ứng | Chỉ môi trường thử; RULE-PAY-002 | AT-02, AT-14 |
| FR-PAY-03 M | Khách gửi lại cùng ý định | Định danh ý định, cùng nội dung → cùng kết quả hoặc trạng thái chờ tra cứu | Không có đơn/thanh toán ngoài ý muốn thứ hai; RULE-ORD-001 | AT-03 |
| FR-PAY-04 M | Khách gặp thanh toán thất bại | Kết quả thất bại → không báo đã thu/đã nhận sai | Tồn kho/giỏ theo chính sách đang mở; RULE-PAY-002 | AT-02 |
| FR-PAY-05 S | Staff/khách đọc trạng thái tiền | Đơn/kết quả thu → phân biệt được chấp nhận, đã thu, hoàn | COD/hoàn cần chính sách; BREQ-PAY-001 | AT-14 |
| FR-INV-01 M | Hệ thống nhận đơn cho khách | SKU, số lượng, đơn hợp lệ → lượng còn bán được phù hợp | Không cam kết vượt nguồn; RULE-INV-001; thời điểm giữ chờ OPEN-STOCK-001 | AT-01, AT-15 |
| FR-INV-02 M | Hai khách cạnh tranh SKU cuối | Hai ý định, số khả dụng=1 → tối đa một cam kết hợp lệ | RULE-INV-001 | AT-15 |
| FR-INV-03 S | Staff xử lý hủy/giao | Quyết định hợp lệ → tồn giữ/còn bán cập nhật theo chính sách | Quyền và điểm trả hàng còn mở; OPEN-STOCK-001 | AT-16 |
| FR-ORD-01 M | Khách xem danh sách/chi tiết đơn | Danh tính, mã đơn → chỉ đơn của mình hoặc từ chối | RULE-ACCESS-001 | AT-04, AT-17 |
| FR-ORD-02 M | Khách xem tiến độ | Mã đơn sở hữu → trạng thái hiện tại có nghĩa | Không hiển thị giao/thu tiền chưa xảy ra; RULE-FUL-001 | AT-17 |
| FR-ORD-03 M | Staff xử lý đơn được giao | Đơn, chuyển trạng thái → kết quả hợp lệ/từ chối | Không nhảy trạng thái hoặc vượt quyền; OPEN-FUL-001, OPEN-USR-003 | AT-10, AT-16 |
| FR-NOT-01 M | Hệ thống nhận đơn hợp lệ | Đơn đã nhận → việc thông báo có thể theo dõi | Lỗi liên lạc không hủy đơn; RULE-NOT-001 | AT-05 |
| FR-NOT-02 M | Staff/hệ thống xử lý lỗi gửi | Việc lỗi/lặp → thử lại có giới hạn, trạng thái theo dõi | Không tạo thông báo trùng ngoài quy tắc; RULE-NOT-001 | AT-05 |
| FR-NOT-03 M | Khách nhận thông tin đơn | Đơn được nhận, kênh đã chốt → thông báo đúng đơn hoặc lỗi gửi có thể xử lý | Kênh email/SMS còn OPEN-USR-009 | AT-05 |
| FR-ADM-01 M | Admin quản lý chào bán/tồn/đơn | Hành động có quyền → thay đổi hoặc từ chối | RULE-CAT-001, RULE-INV-001, RULE-ACCESS-001 | AT-10, AT-18 |
| FR-ADM-02 M | Admin xem báo cáo cơ bản | Khoảng thời gian → số đơn theo trạng thái và ngoại lệ | Không nhập nhằng đặt/thu/giao; chỉ số chờ OPEN-REPORT-001 | AT-18 |

Các mã sau thuộc năng lực tích hợp, phát hành/vận hành hoặc tùy chọn theo SRS lịch sử; vẫn có actor, hành động, input, output, quy tắc và kiểm tra. Chúng không tạo thêm use case sản phẩm ngoài 9 mã Topics.

| ID / mức | Actor; hành động | Đầu vào → đầu ra quan sát được | Quy tắc và nguồn | Kiểm tra |
|---|---|---|---|---|
| FR-INT-01 M | Khách xem sản phẩm khi dữ liệu nóng được tái sử dụng | Mã hàng, bản dữ liệu công bố → kết quả đọc đúng hoặc lỗi rõ | Giá/tồn kiểm lại khi mua; Topics trang 5, BREQ-CAP-001 | AT-06,07 |
| FR-INT-02 M | Admin công bố và khách xem ảnh sản phẩm | Ảnh có quyền sử dụng, metadata → tham chiếu media và ảnh xem được | Binary ở năng lực object media, không lẫn dữ liệu đơn; Topics trang 5 | AT-11,18 |
| FR-INT-03 S | Khách tìm/lọc/sắp xếp qua năng lực tìm kiếm | Từ khóa/điều kiện → kết quả/rỗng | Chỉ hàng được bán; BREQ-DISC-001 | AT-11 |
| FR-OPS-01 M | Nhóm phát hành kiểm thay đổi | Bản mã/đặc tả kiểm tra → kết quả pass/fail lưu được | Không đưa bản lỗi qua gate phát hành; Topics trang 5 | AT-19 |
| FR-OPS-02 M | Nhóm vận hành phát hành lên môi trường thử | Bản phát hành/cấu hình → môi trường có danh tính phiên bản và kiểm tra truy cập an toàn | Chỉ gọi sẵn sàng khi kiểm chứng được; Topics trang 25 | AT-19 |
| FR-OPS-03 M | Nhóm vận hành diễn tập quay lại/khôi phục | Phiên bản cũ/bản sao dữ liệu → kết quả phục hồi có số đo | Không xóa đơn hợp lệ khi quay lại; NFR-REL-03 | AT-08,19 |
| FR-OPS-04 M | Nhóm vận hành quan sát lỗi | Tín hiệu hoạt động/giao dịch → trạng thái, log và cảnh báo có thể đối chiếu | Không đưa PII/secrets vào log; NFR-OBS-01..03 | AT-20 |
| FR-REC-01 C | Người phụ trách dữ liệu chuẩn bị nguồn tùy chọn | Bộ dữ liệu công khai có quyền → bản nguồn và kiểm chất lượng | Không tạo đơn giả/vi phạm quyền tài sản; chỉ làm nếu scope được duyệt | AT tùy chọn, chưa lập |
| FR-REC-02 C | Khách xem gợi ý tùy chọn | Hàng đang bán/ngữ cảnh được phép → gợi ý hoặc bỏ qua an toàn | Lỗi gợi ý không chặn mua; cần đánh giá riêng nếu chọn | AT tùy chọn, chưa lập |

## 3. Dữ liệu, giao diện và ranh giới

Hệ thống cần giữ danh tính và quyền, sản phẩm/biến thể/SKU, giá theo tiền tệ, giỏ, ý định checkout, đơn và dòng đơn, kết quả thanh toán, lượng hàng khả dụng, trạng thái xử lý và kết quả thông báo. Chi tiết tại [mô hình miền](../05-data/domain-model.md). Giao diện nghiệp vụ phải trả trạng thái `thành công / từ chối / chưa rõ`, lỗi có thể xử lý, định danh tương quan cho trường hợp gửi lại, và chỉ dữ liệu thuộc quyền người gọi. Giao thức/đường dẫn và sản phẩm công nghệ thuộc giai đoạn sau. [Hợp đồng giao diện logic](../06-architecture/api-and-interface-contracts.md) làm rõ sau.

Topics trang 5 còn yêu cầu năng lực tìm kiếm, cache dữ liệu nóng, lưu ảnh dạng đối tượng, thông báo bất đồng bộ và thanh toán lặp an toàn. Các mã `FR-INT-*` lịch sử chuyển thành ràng buộc kiến trúc/kiểm chứng ở mục 5; `FR-OPS-*` thành tiêu chí phát hành/vận hành; `FR-REC-*` vẫn tùy chọn. Chúng không phải yêu cầu thao tác mới của Customer. Không chọn sản phẩm lưu trữ hoặc môi trường vật lý tại đây.

## 4. Chất lượng và kiểm chứng

[Tình huống chất lượng](quality-attribute-scenarios.md) là nguồn chuẩn cho NFR; [workload](../04-workload/workload-analysis.md) xác định đầu vào thử tải. Mỗi FR bắt buộc có ít nhất một phép kiểm tra trong bảng trên. Kiểm tra bao gồm thành công, dữ liệu sai, quyền sai, tranh chấp, lỗi bên ngoài và đọc lại trạng thái; một phản hồi giao diện đơn lẻ chưa chứng minh bất biến đơn/tồn/tiền. Bộ AT-01..08 cũ được giữ nghĩa và mở rộng AT-09..18 trong đặc tả use case. Không tuyên bố đã chạy phép thử nào trong tài liệu này.

## 5. Đối chiếu mã lịch sử và xung đột

| Mã cũ | Xử lý trong baseline mới |
|---|---|
| FR-AUTH/CAT/CART/CHK/PAY/INV/ORD/NOT/ADM | Giữ mã khi nghĩa nghiệp vụ tương ứng; bỏ tên framework khỏi câu yêu cầu; bảng mục 2 là định nghĩa đề xuất hiện hành. `FR-ORD-03`, `FR-NOT-03`, `FR-ADM-02` đề xuất nâng từ S lên M vì Topics trang 4 yêu cầu Staff xử lý/trạng thái, notification và báo cáo; chủ nghiệp vụ cần duyệt thay đổi ưu tiên. |
| FR-INT-01/02/03 | Giữ mã và đặc tả theo năng lực đọc nóng/cache, media đối tượng, tìm kiếm; chi tiết ở kiến trúc/workload. |
| FR-OPS-01/02/03/04 | Giữ mã và đặc tả kiểm tra phát hành, triển khai kiểm chứng được, quay lại/khôi phục, quan sát; phép thử thực hiện ở P3/P4, chưa coi đã đạt. |
| FR-REC-01/02 | Giữ `COULD` tùy chọn; nguồn dữ liệu và gợi ý chỉ đưa vào nếu chủ dự án chọn và có phép đánh giá. |
| UC-01..08 cũ | Tình huống kiểm thử lịch sử, không đồng nhất với 9 mã `P1-UC01..09`; xem bảng đối chiếu trong ma trận. |
| NFR-DATA-01; NFR-PERF-04 | Tách bất biến dữ liệu có chủ/giới hạn tài nguyên khỏi tên Medusa/PostgreSQL; công nghệ lịch sử chỉ ở ghi chú nguồn. |

Guest checkout (`OPEN-USR-001/002`), phân quyền Staff/Admin (`OPEN-USR-003/004`), giữ/trả tồn (`OPEN-STOCK-001`), đổi giá (`OPEN-PRICE-001`), kết quả timeout (`OPEN-RETRY-001`) và bộ trạng thái (`OPEN-FUL-001`) còn chờ chủ quyết định. Mâu thuẫn “SRS cũ 8 UC / Topics 9 UC” giải bằng crosswalk; “ảnh S3 tùy chọn / Topics bắt buộc object storage” giải ở mức năng lực, chọn nhà cung cấp sau. Chưa có người rà hoặc bằng chứng phê duyệt; cổng R8 đạt mức **draft coverage**, chưa đạt baseline được duyệt.

| Ngày | Thay đổi |
|---|---|
| 2026-11-15 | Viết bản nháp SRS, giữ mã FR và tách ràng buộc vận hành/công nghệ. |
