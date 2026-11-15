---
document_id: DICT-01
version: 0.1.0
status: Draft — logical meanings
owner: Phân tích dữ liệu (chưa phân công)
reviewer: Chủ nghiệp vụ, bảo mật (chưa xác định)
last_updated: 2026-11-15
source_baseline: DOM-01, BRD-01, SRS-01 Draft
---

# Từ điển dữ liệu nghiệp vụ

Định nghĩa theo [mô hình miền](domain-model.md), [quy tắc](../01-business/business-rules.md) và [SRS](../03-requirements/SRS.md). `Bắt buộc` áp cho bản ghi ở trạng thái nghiệp vụ tương ứng; dữ liệu nháp có thể thiếu. `Công khai`, `nội bộ`, `nhạy cảm`, `PII` là phân loại đề xuất. Định dạng mã, độ dài, kiểu lưu và thời hạn lưu chưa chọn; không dùng kiểu dữ liệu SQL hay tên bảng hiện tại. Chủ và quyền ghi chi tiết tại [ma trận sở hữu](data-ownership-and-consistency.md).

| ID / chủ logic; phân loại | Nghĩa, định danh và thuộc tính trọng yếu | Quan hệ, kiểm tra, vòng đời và câu hỏi |
|---|---|---|
| ENT-CUSTOMER / Identity; PII | Người mua có hồ sơ; `customerId` ổn định; email/liên hệ, trạng thái xác minh | 0..n địa chỉ/đơn/giỏ; một khách không đọc người khác; guest phụ thuộc OPEN-USR-001; retention OPEN-DATA-003 |
| ENT-ADDRESS / Identity; PII | Điểm nhận/liên hệ; `addressId`; người nhận, địa chỉ, số liên lạc theo nhu cầu giao | Thuộc 1 Customer hoặc snapshot giao của đơn; thông tin bắt buộc khi checkout theo FR-CHK-01; không đưa đầy đủ vào event/log |
| ENT-PRODUCT / Catalog; công khai khi công bố | Mẫu hàng; `productId`; tên, mô tả, trạng thái công bố, danh mục | 0..n Variant khi nháp, ≥1 khi chào bán; dừng bán không xóa lịch sử đơn; RULE-CAT-001 |
| ENT-VARIANT / Catalog; công khai/nội bộ | Đơn vị lựa chọn bán; `variantId`, `sku` dự thảo; size/màu và thuộc tính fit/material nếu có, trạng thái bán | Thuộc 1 Product; SKU duy nhất theo phạm vi OPEN-DATA-001; đúng biến thể đi từ giỏ đến dòng đơn; RULE-CAT-001 |
| ENT-MEDIA / Catalog; công khai/nội bộ | Metadata ảnh; `mediaId`, tham chiếu binary, mô tả thay thế, loại/kích thước | Product 0..n Media; binary lưu ở năng lực media đối tượng, không trong bản ghi đơn; quyền dùng ảnh OPEN-ASSET-001; cleanup orphan TBD |
| ENT-PRICE / Pricing; công khai khi chào bán | Giá/điều kiện hiện hành; `priceId`, variant, tiền tệ, số tiền, hiệu lực | Variant 0..n mức giá theo phạm vi; giá hợp lệ tại checkout; đơn giữ snapshot; VND cho bản demo, đơn vị nhỏ nhất OPEN-DATA-002 |
| ENT-CART / Cart; nhạy cảm | Giỏ chỉnh được; `cartId`, chủ/ngữ cảnh, khu vực, trạng thái | 1..n dòng khi checkout, có thể 0 khi đang mua; ngữ cảnh guest chưa chốt; không tự biến giỏ thành đơn |
| ENT-CART-LINE / Cart; nhạy cảm | Lựa chọn biến thể và số lượng; `lineId`, variantId, quantity, tổng dự kiến | Thuộc 1 Cart, quantity nguyên dương; giá dự kiến không là cam kết khi điều kiện đổi; FR-CART-02 |
| ENT-CHECKOUT-ATTEMPT / Checkout; nhạy cảm | Một ý định hoàn tất; `intentId`, dấu nhận diện nội dung, trạng thái, kết quả/đơn nếu có | Một ý định tối đa một Order được nhận; nhiều request cùng ý định trả kết quả cũ; phạm vi/thời hạn định danh OPEN-RETRY-001 |
| ENT-ORDER / Ordering; nhạy cảm/PII giao | Kết quả mua đã nhận; `orderId`, chủ sở hữu, thời điểm, trạng thái đơn, tổng và tiền tệ, snapshot giao | ≥1 dòng; 0..n payment attempt/fulfillment/notification; nhận đơn khác đã thu/giao; INV-ORD-001/ACCESS-001 |
| ENT-ORDER-LINE / Ordering; nhạy cảm | Snapshot hàng mua; `orderLineId`, variantId/SKU, tên/size/màu lúc mua, quantity, giá, phí/thuế phân bổ nếu áp dụng | Thuộc 1 Order; không viết lại khi catalog đổi; INV-PRICE-001; số tiền và quy tắc làm tròn OPEN-DATA-002 |
| ENT-PAYMENT-ATTEMPT / Payment; nhạy cảm tài chính | Một thử nhận kết quả tiền; `paymentAttemptId`, phương án COD/mô phỏng, trạng thái và định danh đối soát | Gắn Order/ý định theo quy trình; nhiều lần thử có thể có, không lặp thu; không lưu số thẻ; INV-PAY-001 |
| ENT-STOCK-POSITION / Inventory; nội bộ | Lượng theo SKU và vị trí logic; `positionId`, onHand, committed, available theo chính sách | Variant 0..n vị trí; MVP một kho giả định; available không âm khi nhận đơn; INV-INV-001, OPEN-STOCK-001 |
| ENT-FULFILLMENT / Fulfillment; nhạy cảm | Tiến độ xử lý đơn; `fulfillmentId`, trạng thái, dấu mốc/nhân viên xử lý | Order 0..n; không tuyên bố đã giao nếu chỉ mới xử lý; nhảy bước/ủy quyền OPEN-FUL-001/USR-003 |
| ENT-NOTIFICATION-INTENT / Notification; nhạy cảm | Việc liên lạc cho sự kiện đơn; `notificationId`, loại, orderId, kênh, trạng thái, số lần thử | Order 0..n; trạng thái gửi tách đơn; nội dung PII tối thiểu; kênh OPEN-USR-009; INV-NOT-001 |
| ENT-REPORT-SNAPSHOT / Reporting; nội bộ | Tổng hợp đơn theo khoảng thời gian/trạng thái; `reportRunId`, khoảng đo, ngày cập nhật | Chỉ đọc nguồn có thẩm quyền; số đơn đặt/thu/giao/hủy tách riêng; độ trễ/số liệu OPEN-REPORT-001 |

## Thuộc tính sự kiện và quy tắc chất lượng

Sự kiện logic cần `eventId` duy nhất, loại, phiên bản, mốc thời gian, nguồn sở hữu, mã tham chiếu miền, correlation/causation nếu cần; chỉ chứa dữ liệu tối thiểu cho consumer. `OrderAccepted` không đồng nghĩa `PaymentCaptured`; `SendOrderNotification` là việc cần làm, không phải bằng chứng đã gửi. Consumer phải chịu được nhận lặp và thứ tự lệch. Bản ghi lịch sử đơn giữ snapshot để kiểm tra giá và biến thể sau khi chào bán thay đổi. Trường email/địa chỉ/số điện thoại là PII; chỉ dùng cho mua/giao/thông báo theo quyền và mục đích; thời hạn giữ, ẩn danh/xóa theo OPEN-DATA-003, không tự viện dẫn một số năm luật định.

**Chưa chốt:** định dạng/duy nhất SKU, từ vựng size/màu, thuế/phí/làm tròn và đơn vị tiền nhỏ nhất, mức bắt buộc địa chỉ, số vị trí tồn, khách vãng lai, retention và chính sách điều chỉnh tồn. Cổng rà soát vẫn Draft.
