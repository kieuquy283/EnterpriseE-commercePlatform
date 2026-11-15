---
document_id: INT-01
version: 0.1.0
status: Draft — logical integration design
owner: Kiến trúc tích hợp (chưa phân công)
reviewer: QA, bảo mật, dữ liệu, vận hành (chưa xác định)
last_updated: 2026-11-15
source_baseline: SRS-01, QAS-01, WL-01, DATA-OWN-01, ARCH-LOG-01 Draft
---

# Thiết kế tích hợp logic

Phạm vi gồm [hợp đồng nội bộ](api-and-interface-contracts.md), đối tác có điều kiện và mô hình lỗi. Đây là đề xuất từ [Business](../01-business/BRD.md), [Data](../05-data/data-ownership-and-consistency.md), [NFR](../03-requirements/quality-attribute-scenarios.md) và Presentation 2 trang 36/39/46. Một event phản ánh điều đã xảy ra; một command yêu cầu thay đổi; một work item là việc cần xử lý. Không mặc định cần broker, event stream hoặc tách nhiều process.

## 1. Hệ thống ngoài và phương án

| Mã / đối tác | Dữ liệu qua ranh giới, trạng thái | Tích hợp/cơ chế xác minh/lỗi |
|---|---|---|
| EXT-PAY-001 / bộ mô phỏng tiền | Kết quả thử, định danh ý định; chỉ môi trường demo | Bắt buộc cho UC05 ở dạng simulation/integration; kết quả phải được xác minh, lặp/timeout đối soát; không gửi số thẻ thật |
| EXT-COMM-001 / kênh thông báo | Liên hệ tối thiểu, loại thông báo, kết quả gửi; kênh OPEN-USR-009 | Provider thử nghiệm/có điều kiện; lỗi không làm mất đơn, retry và trạng thái công việc |
| EXT-MEDIA-001 / năng lực media đối tượng | Binary ảnh, tham chiếu, metadata/alt; quyền asset OPEN-ASSET-001 | Topics trang 5 yêu cầu năng lực; upload có quyền, download theo công bố; provider chọn sau |
| EXT-DELIVERY-001 / bên giao | Mốc giao hàng nếu phạm vi sau này được duyệt | Chưa có yêu cầu tích hợp live; Staff cập nhật trạng thái trong MVP theo quyền, không fake tracking hãng |
| EXT-ID-001 / nhà cung cấp định danh | Chỉ nếu chọn thay thế xác minh nội bộ | Chưa bắt buộc; không suy từ stack lịch sử |

## 2. Quyết định đồng bộ và bất đồng bộ

| Luồng | Caller cần đợi? | Lý do và giới hạn |
|---|---|---|
| Khách duyệt/tìm/xem giỏ/đơn | Có phản hồi đọc | Người dùng cần biết kết quả/được phép; search/cache có thể cũ trong policy TBD |
| Hoàn tất checkout, kiểm giá/tồn/tiền cần thiết | Có kết quả `accepted/rejected/pending` | Không xác nhận nếu chưa có kết quả đơn bền vững; payment ngoài có thể để trạng thái chưa rõ và đối soát, không block vô hạn |
| Đơn được nhận/trạng thái đơn-giao đủ điều kiện → việc gửi thông báo | Không đợi provider gửi xong | INV-NOT-001/002; việc bền và quan sát được, lỗi provider không làm lùi Order/Fulfillment |
| Tìm kiếm/báo cáo projection | Có thể cập nhật sau | Độ trễ cho phép cần chủ nghiệp vụ chốt; checkout luôn kiểm nguồn chuẩn |
| Import/catalog media | Có thể xử lý nền với kết quả tiến độ | Không tranh tài nguyên vô hạn với checkout; số lượng/cửa sổ TBD |

## 3. Event, command và work item

| Mã / loại | Nguồn, điều kiện sinh và consumer | Tác dụng/lặp, dữ liệu tối thiểu |
|---|---|---|
| CMD-CHK-001 `CompleteCheckout` / command | Customer qua Access → Checkout; intent hợp lệ | Yêu cầu kết quả, không là bằng chứng đã nhận; lặp theo intent; giỏ/địa chỉ được xử lý theo quyền |
| EVT-ORD-001 `OrderAccepted` / event | Ordering sau kết quả bền → Notification, Reporting | `eventId`, `orderId`, occurredAt, version, correlation; không mang đầy đủ địa chỉ; consumer dedupe |
| EVT-PAY-001 `PaymentOutcomeRecorded` / event | Payment khi kết quả đã xác minh → Ordering/Reporting theo nhu cầu | Phân biệt COD/chấp nhận/đã thu/thất bại; out-of-order phải đối soát |
| EVT-FUL-001 `OrderStatusChanged` / event | Fulfillment sau bước được phép → Notification khi trạng thái được duyệt công bố, Reporting theo nhu cầu | Mã đơn/trạng thái mới/phiên bản, `eventId`; không tự giả đã giao |
| WORK-NOT-001 `SendOrderNotification` / work item | Notification tạo từ `OrderAccepted` hoặc `OrderStatusChanged` đủ điều kiện → handler gửi | `jobId`, source `eventId`, orderId, state version, kênh/mẫu logic, retry count; idempotent theo sự kiện, trạng thái thất bại thấy được |

Schema chung gồm id, loại, version, producer, timestamp, domain reference, correlation/causation ID khi có. Payload PII tối thiểu; consumer phải hỗ trợ version cũ trong cửa sổ tương thích được chốt. Giao hàng `at least once` có thể lặp: áp dụng idempotency/dedupe và thử lại có giới hạn, backoff và phân loại lỗi tạm/thường trực. Việc thất bại cuối cần hàng chờ xem xét thủ công hoặc trạng thái đối soát tương đương. Không tuyên bố exactly-once vì có hàng chờ. Rủi ro “đơn nhận nhưng event mất” cần cơ chế phát bền và đối soát; transactional outbox là **ứng viên**, chỉ chọn sau khi biết ranh giới dữ liệu/triển khai.

## 4. Ma trận lỗi và trách nhiệm

| Sự cố | Bất biến, phản ứng và nơi quan sát |
|---|---|
| Client timeout sau nhận đơn | INV-ORD-001; IF-CHK-002 tra theo intent, không tạo lần thứ hai; đo outcome pending và đối chiếu đơn |
| Payment timeout/callback lặp | INV-PAY-001; trạng thái chưa rõ/đối soát, xác minh nguồn và dedupe; không báo đã thu giả |
| Hai khách mua SKU cuối | INV-INV-001; chỉ một cam kết hợp lệ, người còn lại từ chối rõ; đo tranh chấp/đợi |
| Nguồn đơn/tồn không sẵn sàng | Không xác nhận accepted; trả lỗi/pending đúng trạng thái; sức khỏe phụ thuộc và thời gian phục hồi được theo dõi |
| Kênh thông báo hỏng | INV-NOT-001; đơn vẫn hợp lệ, job lỗi/lag/retry nhìn thấy; cảnh báo khi vượt ngưỡng đã duyệt |
| Event trạng thái đơn trùng, trễ, đảo thứ tự hoặc mất | Consumer idempotent theo event identity, kiểm version/sequence và trạng thái hiện hành; không gửi mốc cũ sau mốc mới; đối soát nguồn với việc gửi |
| Search/cache/media lỗi hoặc cũ | Không dùng bản đọc cũ để quyết định giá/tồn nhận đơn; fallback/reject theo policy, ảnh lỗi không làm giả giá |
| Tăng tải/worker backlog | Giới hạn retry/queue để tránh khuếch đại; ưu tiên luồng nhận đơn, từ chối an toàn; đo saturation/lag |

Chưa có mục tiêu notification lag, số lần thử, TTL, danh sách trạng thái được thông báo, format webhook, nhà cung cấp, môi trường mạng, ngân sách và chính sách giao nhận. Chúng là đầu vào cho Technology Evaluation và kiểm thử P3/P4; kênh còn OPEN-USR-009, mốc trạng thái còn OPEN-USR-006/OPEN-FUL-001; cổng A6/A7 vẫn Draft. Không có sự kiện hay kênh nào ở đây được tuyên bố đã chạy thật.
