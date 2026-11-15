---
document_id: IF-01
version: 0.1.0
status: Draft — protocol independent
owner: Kiến trúc giao diện (chưa phân công)
reviewer: QA, bảo mật, chủ dữ liệu (chưa xác định)
last_updated: 2026-11-15
source_baseline: SRS-01, DOM-01, ARCH-LOG-01 Draft
---

# Hợp đồng giao diện nghiệp vụ logic

Đây là **ngữ nghĩa thao tác**, chưa là đường dẫn HTTP, OpenAPI hoặc gRPC. Mỗi `IF-*` có caller, chủ dữ liệu, input, kết quả/nhánh lỗi, quyền và phép kiểm chứng. Mọi hợp đồng dùng định danh tương quan, phiên bản schema khi phát hành, trạng thái `accepted / rejected / pending` khi phù hợp. Lỗi thiếu quyền không tiết lộ chi tiết dữ liệu riêng. Số tiền có currency và đơn vị được chốt qua OPEN-DATA-002; định dạng vận chuyển sau. [SRS](../03-requirements/SRS.md), [use case](../03-requirements/use-case-specifications.md), [ownership](../05-data/data-ownership-and-consistency.md).

| IF / chủ, caller; UC | Input/kiểm tra và kết quả | Lỗi, lặp, quyền, freshness và contract test |
|---|---|---|
| IF-IDENT-001 / Access, Customer; UC01 | Email/bí mật hoặc yêu cầu đăng xuất → định danh/quyền hoặc từ chối | Không lộ bí mật, email sai/trùng; AT-09; không tạo quyền Staff/Admin |
| IF-ACCESS-001 / Access, mọi caller; UC01/07/09 | Danh tính, tác vụ, mã tài nguyên → allow/deny trong phạm vi | Kiểm ownership Order/Cart và nhiệm vụ Staff ở mỗi request; AT-04/10; default deny khi policy chưa chốt |
| IF-CAT-001 / Catalog, Customer/Admin; UC02/09 | Bộ lọc/từ khóa/trang/size/màu → danh sách kết quả, tổng/trang, kết quả rỗng | Giới hạn input, pagination ổn định, bỏ hàng chưa công bố; search có thể trễ nhưng gắn thời điểm; AT-11 |
| IF-CAT-002 / Catalog, Customer/Checkout; UC02/04 | productId/variantId → biến thể/SKU, trạng thái công bố, metadata | Không đoán size/tồn; checkout luôn kiểm điều kiện bán hiện hành; AT-11/01 |
| IF-PRICE-001 / Pricing, Cart/Checkout; UC02/03/04 | variant, quantity, vùng/điều kiện → giá có currency, phí/thuế/tổng nếu xác định | Không áp giá catalog cũ vào đơn; thay đổi cần kết quả yêu cầu xác nhận lại; AT-01/12 |
| IF-CART-001 / Cart, Customer; UC03 | cartId/ngữ cảnh, variant, quantity/action → trạng thái giỏ, tổng dự kiến | Chỉ giỏ mình; số lượng nguyên dương, SKU hợp lệ; update lặp không nhân dòng ngoài ý muốn; AT-12; guest OPEN-USR-001 |
| IF-CHK-001 / Checkout, Customer; UC04/05 | intentId, giỏ, giao/thu tiền, dấu nội dung → `accepted(orderId)` / `rejected(reason)` / `pending(intentId)` | Cùng intent+cùng nội dung trả cùng kết quả; khác nội dung từ chối; timeout tra IF-CHK-002; AT-01/02/03/13/15 |
| IF-CHK-002 / Checkout, Customer/Staff có quyền; UC04 | intentId và danh tính → trạng thái cuối/chưa rõ, orderId nếu có quyền | Không tạo tác dụng mới khi tra; không lộ đơn người khác; AT-03/04 |
| IF-ORD-001 / Order, Customer/Staff; UC04/07 | orderId hoặc bộ lọc phân trang có quyền → đơn, dòng snapshot, trạng thái | Customer chỉ đơn mình, Staff theo việc; cập nhật đơn cũ không đổi giá/variant snapshot; AT-04/17 |
| IF-PAY-001 / Payment, Checkout/adapter đáng tin; UC05 | intent/order, phương án, kết quả có xác minh → trạng thái tiền riêng | COD chưa thu, simulator chỉ thử; lặp/out-of-order đối soát, không false captured; AT-02/14 |
| IF-INV-001 / Inventory, Checkout/Staff có quyền; UC06 | SKU, quantity, ý định/nguồn thay đổi → khả dụng/cam kết hoặc từ chối | Cam kết đồng thời không vượt tồn; điều chỉnh/hủy theo quyền và policy; AT-15/16 |
| IF-FUL-001 / Fulfillment, Staff/Customer đọc; UC07 | orderId, bước xử lý, danh tính → trạng thái mới/lịch sử hoặc từ chối | Guard trạng thái, Customer chỉ đọc đơn mình; OPEN-FUL-001; AT-17 |
| IF-NOT-001 / Notification, Order/Fulfillment/Staff; UC08 | OrderAccepted hoặc OrderStatusChanged đã qua kiểm tra công bố, eventId/orderId/state version và kênh logic → kết quả gửi/lag/lỗi | Order/Fulfillment không chờ gửi; idempotent theo event identity + kênh/mẫu, bỏ sự kiện cũ/sai trạng thái, retry hữu hạn, PII tối thiểu; AT-05; kênh OPEN-USR-009, mốc OPEN-USR-006 |
| IF-MEDIA-001 / Catalog, Customer/Admin; UC02/09 | mediaId, quyền, metadata → ảnh hoặc trạng thái thiếu; Admin công bố ảnh | Binary qua object media capability; quyền tài sản và giới hạn loại/kích thước TBD; AT-11 |
| IF-ADMIN-001 / Admin, Staff/Admin; UC06/09 | hành động catalog/tồn/đơn và phạm vi quyền → đổi có dấu vết hoặc từ chối | Chỉ gọi IF chủ miền; không ghi dữ liệu chéo; AT-10/16/18 |
| IF-REPORT-001 / Reporting, Admin/Staff theo quyền; UC09 | Khoảng thời gian/bộ lọc → số đơn đặt/thu/giao/hủy, thời điểm dữ liệu | Pagination/giới hạn, không lộ PII, độ trễ OPEN-REPORT-001; AT-18 |

## Quy ước áp dụng chung

- **Input:** mã tài nguyên ổn định, số lượng dương, tiền kèm currency; giá/stock được kiểm lại ở ranh giới nhận đơn. Các trường không hợp lệ bị từ chối trước thay đổi có hiệu lực. Nếu phân trang, ghi cursor/offset, thứ tự và giới hạn ở bản transport sau.
- **Kết quả:** `accepted` chỉ khi hậu điều kiện bền vững; `rejected` không có tác dụng ngoài ý muốn; `pending` có định danh tra cứu và điều kiện hết hạn/đối soát. Không dùng lỗi hạ tầng để khẳng định giao dịch thất bại nếu trạng thái chưa rõ.
- **Quyền:** xác thực người gọi khác kiểm quyền từng tài nguyên. Customer A≠B, Staff có phạm vi công việc, Admin không tự là người được xuất PII. Quy tắc quyền còn OPEN thì thao tác nhạy cảm mặc định không cấp.
- **Lặp/đồng thời:** IF-CHK-001/IF-PAY-001/IF-INV-001 cần định danh thao tác và kết quả ổn định; kiểm tranh chấp stock=1 và cùng intent. Các thao tác đọc lặp an toàn; lệnh thay đổi trạng thái có guard phiên bản/kết quả cũ để tránh nhảy bước.
- **Version:** thêm trường tương thích, không đổi nghĩa `accepted`/tiền/đơn; phiên bản mới cần test đọc cũ và viết mới. Cách đánh số, transport và mã lỗi wire-level thuộc giai đoạn công nghệ/triển khai.
- **Kiểm thử hợp đồng:** mỗi IF có ca hợp lệ, input sai, thiếu quyền, kết quả rỗng, lặp, cạnh tranh và lỗi phụ thuộc liên quan trong AT-01..18. NFR latency/error theo lớp thao tác ở [QAS](../03-requirements/quality-attribute-scenarios.md), không tự gắn một con số cho mọi IF.

Chưa chốt guest checkout, thời hạn intent, bộ trạng thái, phí/thuế, media rights và độ tươi search. Cổng giao diện A4 vẫn Draft; bản OpenAPI/đường dẫn thực tế chỉ lập khi chọn transport và kiểm với implementation.
