---
document_id: WL-01
version: 0.1.0
status: Draft — assumptions and test targets only
owner: Phân tích tải/QA (chưa phân công)
reviewer: Chủ nghiệp vụ, kiến trúc, vận hành (chưa xác định)
last_updated: 2026-11-15
source_baseline: BRD-01, SRS-01, QAS-01 Draft; Topics trang 5; Presentation 1 trang 38–41, Presentation 4 trang 9/17
---

# Phân tích tải công việc

## 1. Bằng chứng, đơn vị và giả định

Không có analytics, số khách, số đơn/ngày, kích thước catalog hoặc traffic của doanh nghiệp giả định; **BUSINESS-OBSERVED = none**. `ASSUMPTION` là hành vi mô phỏng cần chủ nghiệp vụ rà; `TEST-TARGET` là mục tiêu thử cũ; `MEASURED` chỉ dùng khi có run, môi trường, cấu hình, timestamp và kết quả đọc lại. Hiện **MEASURED = none**. Kịch bản 1 triệu request/ngày, factor 10 của Presentation 1 trang 41 chỉ minh họa phép tính, không là dữ liệu dự án. Các hồ sơ sau nối [BRD](../01-business/BRD.md), [journey](../02-users/user-journeys.md), [SRS](../03-requirements/SRS.md), [QAS](../03-requirements/quality-attribute-scenarios.md).

Một request khác một lượt xem, một phiên, một khách hoạt động hay một giao dịch. `avg RPS = số request/ngày / 86.400` chỉ hợp lệ khi mẫu số/ngày rõ; `peak RPS = avg RPS × peak factor` cần số liệu/giả định riêng. `in-flight ≈ arrival rate × thời gian phản hồi trung bình` trong trạng thái ổn định, không phải số người đang đọc trang. Mọi tốc độ bên dưới là request theo **từng lớp thao tác**, không cộng ngầm với ảnh hoặc job.

## 2. Danh mục profile

`TBD` nghĩa là chưa có căn cứ số, không phải không có tải. Tỷ lệ đọc/ghi, kích thước payload, số phiên và tăng trưởng là biến đầu vào cần lấy qua dữ liệu thử hoặc quyết định người phụ trách. Các năng lực cache, tìm kiếm và media là yêu cầu Topics trang 5; không chọn sản phẩm cung cấp ở đây.

| ID / nguồn | Actor, trigger, lớp và mix thao tác | Trạng thái, phụ thuộc, tài nguyên nghi vấn | Rate/concurrency/data và chất lượng | Kiểm thử/rủi ro |
|---|---|---|---|---|
| WL-CAT-001; BREQ-CAT-001, J-01, FR-CAT-01/02 | Khách duyệt danh sách/chi tiết; online đọc nhiều; tỷ lệ list/detail `TBD` | Đề nghị bán/giá/khả năng mua; truy vấn, cache nóng, phân trang | **TEST-TARGET** 30 RPS tổng nhóm đọc 10 phút nếu mix được chốt; p95<600 ms, lỗi hệ thống<1%; kích thước catalog/payload/concurrency TBD | AT-07; cache cũ, hot SKU, catalog rỗng |
| WL-SEARCH-001; BREQ-DISC-001, J-01, FR-CAT-03/05 | Khách tìm/lọc/sắp xếp; online đọc; từ khóa phổ biến/hiếm mix TBD | Kết quả có thể chậm cập nhật; giá/tồn phải kiểm lại lúc mua; truy vấn/chỉ mục | Rate, độ dài từ khóa, phân trang, kích thước index TBD; thuộc hoặc tách khỏi 30 RPS chỉ sau khi chốt mix | AT-11/07; truy vấn đắt, kết quả cũ |
| WL-MEDIA-001; BREQ-CAT-001, J-01, FR-INT-02 | Khách tải ảnh; file delivery, đọc lớn; số ảnh/lượt xem TBD | Metadata sản phẩm khác binary; băng thông/egress, cache ảnh | Ảnh/sản phẩm, bytes/ảnh, lượt tải/ngày, tăng trưởng TBD; không tính chung RPS API | AT-11; media unavailable/ảnh thiếu |
| WL-CART-001; BREQ-CART-001, J-02, FR-CART-01..04 | Khách thêm/sửa/xóa/xem giỏ; online đọc/ghi | Biến thể, giá dự kiến, phiên/ownership; cập nhật tranh chấp | Requests/phiên, tỷ lệ ghi, payload và session length TBD | AT-12; giỏ lẫn khách, giá cũ |
| WL-CHK-001; BREQ-ORD-001, J-02, FR-CHK-01..04 | Khách hoàn tất; giao dịch ghi; mix hợp lệ/sai tách riêng | Kiểm lại giá, tồn, tiền, ý định; tranh chấp/độ trễ ngoài | **TEST-TARGET** 3 ý định hợp lệ/s ×5 phút, p95<1.500 ms, lỗi hệ thống<1%; số ý định cùng SKU TBD | AT-01/03/07/15; gửi lặp, timeout, overload |
| WL-PAY-001; BREQ-PAY-001, J-02, FR-PAY-01..05 | COD hoặc mô phỏng; giao dịch/đối tác; mix TBD | Kết quả tiền tách đơn; độ trễ, thất bại và callback lặp | Tỷ lệ COD/mô phỏng, latency đối tác, timeout TBD; phụ thuộc WL-CHK | AT-02/14; kết quả chưa rõ, trùng tác dụng |
| WL-INV-001; BREQ-INV-001, J-02/J-04, FR-INV-01..03 | Cam kết tồn khi nhận đơn; Staff điều chỉnh; ghi đồng thời | SKU nóng, giữ/trả, giới hạn số khả dụng | RPS ghi thông thường TBD; phép thử stock=1 với 2 yêu cầu đồng thời bắt buộc bất kể tổng RPS | AT-15/16; oversell, deadlock/đợi lâu |
| WL-NOT-001; BREQ-NOT-001, J-02/J-03, FR-NOT-01..03 | Đơn được nhận và mỗi mốc đơn/giao đủ điều kiện tạo việc gửi; background/bất đồng bộ | Tốc độ job đến/hoàn tất, fan-out theo sự kiện, retry, lỗi kênh, backlog | Jobs/đơn và mốc trạng thái, service time, lag cho phép, backlog tối đa TBD | AT-05; provider down, event trùng/trễ/mất/sai thứ tự, backlog sau nhiều chuyển trạng thái |
| WL-IMPORT-001; PROC-CAT-001, FR-ADM-01 | Admin nhập/cập nhật nhiều SKU; batch tùy scope | Kiểm dữ liệu, đối chiếu biến thể/giá; cạnh tranh tài nguyên với checkout | SKU/batch, cửa sổ chạy, bytes, tăng trưởng TBD; giả định có thể cần nhập thử | AT-18; dữ liệu sai, ảnh hưởng online |
| WL-ADMIN-001; BREQ-OPS-001, J-03/J-04, FR-ADM-01/02 | Staff xem/xử lý đơn; Admin sửa và báo cáo; interactive + tổng hợp nhỏ | Phân quyền, báo cáo theo trạng thái, PII tối thiểu | Tần suất, khoảng dữ liệu báo cáo, concurrency TBD; giả định thấp chưa được chứng minh | AT-10/18; truy vấn tổng hợp chặn giao dịch |
| WL-REC-001; FR-REC-02 COULD | Gợi ý nếu được chọn; online/batch tùy thiết kế | Phụ thuộc dữ liệu công khai, lỗi phải không chặn checkout | Toàn bộ rate, latency, token/cost TBD; ngoài core baseline | Chỉ lập test khi chủ dự án duyệt |

## 3. Phong bì tải và phép tính cần điền

| Tình huống | Đầu vào giả định cần chốt | Phân bố và kiểm tra |
|---|---|---|
| Ngày bình thường | Khách hoạt động/ngày × phiên/khách × thao tác/phiên × request/thao tác | Chia theo giờ, tách API/media, tách đọc/ghi; hiện TBD |
| Đợt khuyến mại | Peak factor và thời gian lên/giữ/xuống đỉnh; SKU/keyword nóng | Không suy từ load target thành nhu cầu thật; kiểm search/cache và checkout cùng lúc |
| Cạnh tranh SKU cuối | Stock=1, hai checkout độc lập cùng SKU | Ưu tiên bất biến tồn hơn throughput; thử ở mức tải thấp cũng cần |
| Thông báo sau nhiều đơn | Jobs/đơn × đơn hợp lệ/s, thời gian phục vụ/job | Nếu arrival > service rate, backlog tăng; đo lag và khả năng phục hồi |
| Nhập hàng cùng lúc khách mua | SKU/batch, kích thước và cửa sổ nhập | Quan sát ảnh hưởng tới giá/tồn và độ trễ checkout |

**Ví dụ tính giả định, không là target:** nếu chủ dự án giả định 100 khách hoạt động/ngày, 2 phiên/khách, 5 thao tác/phiên, 2 request API/thao tác, thì 2.000 API request/ngày và trung bình ≈0,023 RPS. Phải gắn phân bố theo giờ và peak factor trước khi suy peak. Nhân đôi mọi biến có thể nhân tải lên nhiều lần; số 100/2/5/2 chỉ để minh họa độ nhạy, không là dữ kiện SOMEHOW. `orders/year = orders/day × active_days`; lưu lịch sử, backup và bản sao tính riêng khi có chính sách lưu giữ.

## 4. Kịch bản thử và cách đếm

| Kịch bản dự kiến | Mẫu/rate/cửa sổ | Bất biến và bằng chứng cần lưu |
|---|---|---|
| Catalog baseline | 30 RPS ×10 phút **TEST-TARGET**, mix list/detail/search phải chốt; ramp và cache warm/cold tách | p50/p95/p99, lỗi hệ thống, response size, độ đúng SKU/giá; AT-07 |
| Checkout baseline | 3 ý định hợp lệ/s ×5 phút **TEST-TARGET**; tập SKU đủ hàng, ý định duy nhất; nhánh sai đo riêng | p95, kết quả và đọc lại đơn/tiền/tồn; AT-01/07 |
| Spike và stress | Thử ×5/×10 so với baseline thử, không là capacity hứa hẹn; thời gian burst TBD | Điểm bão hòa, từ chối an toàn, retry amplification, phục hồi |
| Endurance | Thời lượng do QA chốt, sau baseline | Tài nguyên tăng dần, backlog, invariant không vỡ |
| Last SKU race | 2+ checkout độc lập, stock=1, nhiều vòng có reset | ≤1 đơn hợp lệ cam kết; ghi mọi kết quả và snapshot |
| Notification failure and status updates | Provider down rồi hồi; batch đơn hợp lệ và chuỗi chuyển trạng thái | Đơn/trạng thái còn đúng; backlog/trials và kết quả từng event rõ; không gửi trùng hoặc đảo thứ tự; AT-05 |
| Dependency failure | Tắt cache/search, nguồn giao dịch hoặc media từng loại | Không xác nhận đơn giả; fallback chỉ theo phương án review; AT-06 |

Thử `4xx` do dữ liệu/giới hạn đúng nghiệp vụ tách khỏi `5xx`, timeout và phản hồi sai. Throughput hoàn tất khác arrival rate; nhận job vào hàng chờ chưa chứng minh đã gửi thông báo. Không có load test được chạy trong phase này; P4 sẽ lưu run ID, dataset, cấu hình, bản báo cáo thô và phép đọc lại trạng thái.

## 5. Tài nguyên, tăng trưởng và ranh giới thiết kế

| Profile | CPU/RAM | I/O, mạng, dữ liệu | Phụ thuộc/bottleneck cần đo |
|---|---|---|---|
| Catalog/search | Xử lý truy vấn, cache | Đọc/chỉ mục, payload | Từ khóa nóng, phân trang, miss cache |
| Checkout/inventory | Xác minh/quy tắc | Ghi bền, khóa/cạnh tranh SKU | Kết nối/lock, payment timeout, retry |
| Media | Ít CPU nghiệp vụ | Binary reads và egress | Số ảnh, kích thước, cache hit |
| Notification | Worker, trạng thái job | Outbound, backlog | Provider latency, retry amplification |
| Import/report | Xử lý lô/tổng hợp | Quét/ghi nhiều | Chặn workload online, PII |

Không suy số máy từ RPS: P4 trang 9 liệt kê CPU, RAM, I/O, mạng, truy vấn, kết nối, lock, API ngoài; trang 17 cảnh báo nhân ứng dụng có thể làm cạn kết nối dữ liệu. [Data phase](../05-data/domain-model.md) cần quyết định bất biến và pattern đọc/ghi; [logical architecture](../06-architecture/logical-architecture.md) cần giải thích ranh giới checkout, search, media, async và kiểm soát backlog. Giá/khả năng bán trong cache hoặc search không được thay thế kiểm tra có thẩm quyền khi nhận đơn.

## 6. Câu hỏi và review gate

`OPEN-WL-001` (chủ nghiệp vụ): số khách/phiên và phân bố giờ; `OPEN-WL-002` (QA): mix catalog/search, dataset, payload; `OPEN-WL-003` (vận hành): SKU/batch, ảnh, đơn/ngày, retention; `OPEN-WL-004` (chủ sản phẩm): đỉnh khuyến mại và tỷ lệ payment; `OPEN-WL-005` (QA): môi trường, ramp, error denominator và cửa sổ endurance. Đây là mã mới ở tài liệu tải, chưa được quyết định; [sổ nguồn](../00-project/source-and-assumption-register.md) giữ nguồn Business/Users. Cổng W9 có đủ danh mục và phép thử dự kiến nhưng **chưa đạt chuẩn baseline được duyệt** do các tham số và số đo còn mở.
