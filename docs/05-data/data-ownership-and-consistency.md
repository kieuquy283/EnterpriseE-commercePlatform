---
document_id: DATA-OWN-01
version: 0.1.0
status: Draft — proposed ownership
owner: Phân tích dữ liệu (chưa phân công)
reviewer: Chủ nghiệp vụ, bảo mật, vận hành (chưa xác định)
last_updated: 2026-11-15
source_baseline: DOM-01, WL-01, QAS-01 Draft
---

# Quyền sở hữu và tính nhất quán dữ liệu

Chủ ở bảng này là **miền logic**, không là cơ sở dữ liệu hay nhà cung cấp. Mỗi nhóm bản ghi chỉ có một bên quyết định thay đổi chuẩn; bên khác đọc qua hợp đồng có kiểm quyền, không tự ghi chung. [Mô hình](domain-model.md), [từ điển](data-dictionary.md), [quyền người dùng](../02-users/actors-and-user-goals.md), [workload](../04-workload/workload-analysis.md) và [QAS](../03-requirements/quality-attribute-scenarios.md) là đầu vào. Ma trận chưa được chủ dữ liệu duyệt.

| Dữ liệu | Chủ / bên được ghi | Đọc có quyền | Phân loại, nhất quán và retention |
|---|---|---|---|
| Customer/Address | Identity; khách sửa dữ liệu mình qua thao tác được phép | Chính khách, Staff được giao tối thiểu phần giao | PII; kiểm sở hữu từng tài nguyên; thời hạn TBD |
| Product/Variant/Media metadata | Catalog; Admin được giao công bố/sửa | Khách với phần công khai, tìm kiếm, giỏ | Công khai/nội bộ; công bố nhất quán; bản chào bán có thể cache theo policy TBD |
| Price | Pricing; người có thẩm quyền cập nhật | Catalog/Cart/Checkout; khách xem giá chào | Công khai theo điều kiện; checkout kiểm giá có thẩm quyền; lịch sử trong OrderLine |
| Cart/CartLine/CheckoutAttempt | Cart/Checkout; khách sửa giỏ mình, điều phối checkout ghi kết quả | Chính khách, Ordering khi nhận đơn | Nhạy cảm; ý định lặp giữ cùng kết quả; thời hạn giỏ/ý định TBD |
| Order/OrderLine | Ordering; chỉ quy trình nhận đơn/chuyển trạng thái được phép | Khách sở hữu, Staff theo việc, Payment/Fulfillment/Reporting tối thiểu | PII/kinh doanh; mã/giá/sản phẩm lịch sử không bị ghi đè; retention TBD |
| PaymentAttempt | Payment; adapter kết quả có kiểm chứng | Checkout/Order, Staff được giao trạng thái | Nhạy cảm; không báo đã thu giả; không lưu thẻ |
| StockPosition | Inventory; điều phối cam kết hoặc Staff được phép điều chỉnh | Catalog (hiển thị), Checkout, Staff | Nội bộ; bất biến SKU tại thời điểm nhận đơn, không chấp nhận stale availability để cam kết |
| Fulfillment | Fulfillment; Staff có quyền chuyển bước | Khách chỉ đơn mình; Reporting | Nhạy cảm; bước trạng thái có guard; OPEN-FUL-001 |
| NotificationIntent | Notification; việc gửi/kết quả cho OrderAccepted hoặc mốc OrderStatusChanged/Fulfillment được phép công bố | Staff được giao; khách chỉ nhận nội dung tối thiểu tương ứng sự kiện | Nhạy cảm; gửi có thể trễ, lỗi không đổi Order/Fulfillment; event identity/version chống trùng và sai thứ tự; retention TBD |
| ReportSnapshot | Reporting; xây từ nguồn có thẩm quyền | Admin/Staff theo quyền | Nội bộ; cho phép trễ có gắn thời điểm tạo, chính sách độ trễ TBD |

## 1. Pattern truy cập, độ tươi và tài nguyên

| Nhu cầu / nguồn | Nguồn chuẩn, bản đọc và độ tươi | Hành vi khi lỗi/cũ |
|---|---|---|
| Xem/tìm sản phẩm, WL-CAT/SEARCH | Catalog/Price là chuẩn; có thể dùng cache/search projection nếu chủ nghiệp vụ chấp nhận độ trễ xuất bản `TBD` | Hàng không còn bán không được kết luận mua được chỉ từ kết quả cũ; checkout kiểm lại |
| Xem ảnh, WL-MEDIA | Metadata thuộc Catalog; binary qua năng lực object media riêng theo Topics trang 5 | Ảnh thiếu có placeholder/đánh dấu lỗi; không làm sai Order |
| Giỏ, WL-CART | Cart có trạng thái riêng; giá/tồn chỉ là dự kiến | Khi đổi giá/hết hàng, yêu cầu khách xử lý trước nhận đơn |
| Nhận đơn, WL-CHK/INV/PAY | Ordering quyết định kết quả, Inventory quyết định khả năng cam kết, Payment quyết định trạng thái tiền | Không xác nhận giả khi một quyết định thiết yếu chưa rõ; đọc lại theo intent |
| Theo dõi đơn, WL-ADMIN | Order/Fulfillment là chuẩn; khách chỉ đơn mình | Nếu bản đọc chậm, hiển thị thời điểm cập nhật; không bịa trạng thái giao |
| Thông báo, WL-NOT | OrderAccepted hoặc chuyển trạng thái đơn/giao đủ điều kiện tạo nhu cầu; Notification giữ kết quả gửi riêng | Chậm được nếu có ngưỡng được duyệt; trang đơn là nguồn chuẩn; mất/lặp/trễ/sai thứ tự phải đối soát và thử lại an toàn theo event identity |
| Báo cáo/nhập hàng, WL-ADMIN/IMPORT | Reporting có thể dùng bản tổng hợp; Catalog nhập qua kiểm tra hợp lệ | Chưa chốt độ trễ báo cáo; nhập hàng không được phá SKU/giá đang bán |

Không ấn định TTL, index, engine search hoặc cache; trigger vô hiệu hóa gồm công bố/ngừng bán/đổi giá/đổi tồn, còn thời gian chấp nhận trễ `OPEN-DATA-006`. Ảnh cần chính sách loại/kích thước, quyền upload, bản gốc/bản dẫn xuất, tham chiếu mồ côi, xóa an toàn, egress; quyền sử dụng tài sản `OPEN-ASSET-001`. Một datastore vật lý có thể chứa nhiều miền nhưng vẫn phải giữ hợp đồng ghi một chủ.

## 2. Ranh giới nhất quán và xử lý thất bại

| Hành động | Bất biến và mức nhất quán | Lặp/lỗi, bù trừ và đối soát |
|---|---|---|
| Sửa giỏ | Đúng variant, số lượng dương; giá/tồn có thể đổi trước checkout | Sai đầu vào từ chối, không tạo Order |
| Hoàn tất checkout | INV-ORD-001, INV-INV-001, INV-PRICE-001, INV-PAY-001 cần đúng khi công bố đơn được nhận | Cùng intent/nội dung trả cùng kết quả; timeout tra trước khi tạo tác dụng mới; nếu payment ngoài hệ thống không rõ, đối soát, không khẳng định atomic xuyên đối tác |
| Điều chỉnh tồn | Số có thể bán không âm theo policy, quyền Staff/Admin đúng | Đối chiếu ghi chép; hủy/trả theo OPEN-STOCK-001, không tự hoàn trả hai lần |
| Thay giá/công bố | OrderLine cũ không đổi; cart phải kiểm lại giá | Cache/search bị vô hiệu hoặc chậm có cảnh báo, checkout lấy chuẩn |
| Gửi thông báo | INV-NOT-001; eventual sau Order | Có event/job identity, consumer idempotent, retry hữu hạn và trạng thái cần xử lý; việc mất/lặp được đối soát |
| Tổng hợp báo cáo | Phân biệt đặt/thu/giao/hủy, thời điểm snapshot rõ | Có thể tính lại; độ trễ cho phép chờ OPEN-REPORT-001 |

Tại ranh giới Ordering/Inventory/Payment, cần chứng minh cách giữ các bất biến bằng phép thử cạnh tranh và lỗi. Chưa chọn transaction vật lý, saga, outbox hoặc số kho dữ liệu. Nếu phát sự kiện sau khi nhận đơn, việc phát và việc nhận đơn có nguy cơ lệch; kiến trúc phải chọn cơ chế bền vững/đối soát khi đã biết công nghệ. `OrderAccepted` là sự kiện kết quả, `CompleteCheckout` là command, `SendNotification` là công việc; consumer chịu được lặp/đến sai thứ tự và version cũ. Không tuyên bố exactly-once xuyên hệ thống.

## 3. Riêng tư, phục hồi và chuyển đổi

Khách chỉ đọc/sửa dữ liệu mình; Staff/Admin chỉ theo việc được giao và thao tác thay đổi cần dấu vết người, thời gian, đối tượng, kết quả. Nhật ký/sự kiện/bản tìm kiếm không mang địa chỉ, số liên hệ hoặc bí mật nếu không cần; quyền truy cập dữ liệu có mục đích. Chính sách lưu giữ, xóa/ẩn danh, và quyền xuất dữ liệu chờ `OPEN-DATA-003` và `OPEN-USR-004`, không gắn số năm giả. Bản sao/khôi phục cần giữ quan hệ Order–Line–Payment–Stock và định danh ý định; RPO ≤60 phút/RTO ≤120 phút chỉ là mục tiêu đề xuất trong QAS-DR-001, chưa có drill.

Nếu chuyển dữ liệu từ triển khai cũ, cần mapping Product/Variant/SKU và trạng thái tiền/đơn, bảo toàn mã đối chiếu, phát hiện bản trùng, backfill an toàn, so sánh số lượng/tổng tiền và phương án rollback. Đây là yêu cầu logic; script, schema và phương án hạ tầng thuộc giai đoạn công nghệ/vật lý. Cổng D9 còn chờ quyết định quyền/chính sách, độ tươi, retention và review chủ dữ liệu.
