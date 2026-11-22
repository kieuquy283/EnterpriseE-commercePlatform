---
document_id: TECH-BE-05-STATUS-01
title: BE-05 fulfillment, tracking và COD status contract
version: 1.0.0
status: Proposed — chờ xác nhận nghiệp vụ và kiểm chứng runtime
owner: Backend
last_updated: 2026-11-22
related_documents:
  - ../spec/02-flows.md
  - ../spec/04-data-api.md
  - ../spec/06-operations.md
  - staff-admin-permission-matrix.md
  - ../report/be-05-staff-walkthrough.md
---

# BE-05 — Hợp đồng trạng thái fulfillment, tracking và COD

## 1. Phạm vi và trạng thái

Hợp đồng này tách trạng thái đơn hàng, xử lý giao hàng và thanh toán theo Medusa 2.21.2. Đây là contract đề xuất; chưa phải bằng chứng rằng toàn bộ chuyển trạng thái đã chạy trên Admin, storefront hoặc một đơn hàng thật.

Quyền Staff khác Admin thuộc BE-08. Xem [ma trận Staff/Admin](staff-admin-permission-matrix.md), hiện vẫn là Proposed; đăng nhập được `/app` không chứng minh người dùng bị giới hạn quyền.

## 2. Các trục trạng thái

| Trục | Nguồn có thẩm quyền | Quy tắc |
|---|---|---|
| Vòng đời đơn | `order.status` của Medusa | Không dùng trạng thái đơn để suy ra đã thu tiền hoặc hàng đã giao. |
| Chuẩn bị/giao hàng | `order.fulfillment_status` và fulfillment của Medusa | Tách trạng thái chuẩn bị khỏi bàn giao và bằng chứng giao thực tế. |
| Thanh toán | `order.payment_status` và payment của Medusa | COD khi đặt đơn là chưa thu tiền; giá trị đơn không phải số COD đã thu. |
| Tracking | Tracking link/number gắn với fulfillment khi Admin hỗ trợ | Chỉ ghi thông tin do đơn vị vận chuyển cung cấp. Không tạo mã, URL, hãng vận chuyển hoặc sự kiện giả. |
| Tồn kho | Inventory/stock location và reservation của Medusa | Tồn vật lý, lượng giữ chỗ và lượng xuất giao là các giá trị khác nhau. Không coi tạo đơn là đã xuất kho. |

Medusa 2.21.2 khai báo các giá trị fulfillment: `not_fulfilled`, `partially_fulfilled`, `fulfilled`, `partially_shipped`, `shipped`, `partially_delivered`, `delivered`, `canceled`; payment status gồm `not_paid`, `awaiting`, `authorized`, `partially_authorized`, `captured`, `partially_captured`, `partially_refunded`, `refunded`, `canceled`, `requires_action`. Đây là tập giá trị framework hiện cài, không phải cho phép tự gán trạng thái.

## 3. Ý nghĩa và quy tắc hiển thị

| Trạng thái fulfillment | Ý nghĩa nghiệp vụ | Điều không được suy diễn |
|---|---|---|
| `not_fulfilled` | Chưa tạo/hoàn tất fulfillment | Không có nghĩa đơn đã bị hủy. |
| `partially_fulfilled` / `fulfilled` | Một phần/toàn bộ hàng đã được chuẩn bị trong fulfillment | Không chứng minh kiện hàng đã rời kho hoặc đã giao. |
| `partially_shipped` / `shipped` | Một phần/toàn bộ fulfillment được đánh dấu đã gửi trong Medusa Admin | Không chứng minh hãng vận chuyển đã quét kiện nếu không có bằng chứng bàn giao. |
| `partially_delivered` / `delivered` | Một phần/toàn bộ fulfillment được đánh dấu đã giao | Chỉ cập nhật sau khi nhân viên xác minh bằng chứng giao; đây là thao tác thủ công, không phải tín hiệu carrier thật. |
| `canceled` | Fulfillment bị hủy theo thao tác Medusa được hỗ trợ | Không tự suy ra đơn đã hủy hoặc tồn đã được nhập lại. |

| Trạng thái payment | Ý nghĩa với COD |
|---|---|
| `not_paid` / `awaiting` | Chưa có bằng chứng tiền đã được thu. Cách khởi tạo cụ thể phải được xác nhận trên fixture BE-05. |
| `captured` / `partially_captured` | Chỉ phản ánh số tiền đã thu khi thao tác thanh toán được hỗ trợ và có chứng cứ thu tương ứng. |
| `refunded` / `partially_refunded` | Chỉ dùng khi có thao tác hoàn tiền và chứng từ đối soát tương ứng. |
| Trạng thái khác | Hiển thị theo giá trị Medusa; không đổi nghĩa COD hoặc tự gán bằng sửa dữ liệu trực tiếp. |

Storefront phải hiển thị trạng thái fulfillment và payment riêng; không gộp thành một nhãn “đơn hoàn tất”. Giá trị không nhận diện được hiển thị trung tính, không ánh xạ thành đã giao/đã thu. Hủy, hoàn tiền, giao một phần và giao thất bại cần giữ lịch sử và bằng chứng.

## 4. Chuyển trạng thái và audit

1. Nhân viên rà order, biến thể, địa điểm kho và tồn/giữ chỗ trước khi lấy hàng.
2. Tạo fulfillment qua thao tác Admin Medusa được hỗ trợ; ghi nhận kết quả từng item và đối soát tồn. Không cập nhật bảng lõi trực tiếp.
3. Ghi tracking number/URL chỉ khi có giá trị thật từ carrier. Nếu không có thông tin carrier, để trống; ghi bàn giao thủ công riêng, không tạo tracking giả.
4. Chỉ đánh dấu shipped sau khi có bằng chứng bàn giao kiện; chỉ đánh dấu delivered sau khi xác minh bằng chứng giao. Lưu actor, thời điểm và tham chiếu bằng chứng đã giảm dữ liệu cá nhân.
5. Đối soát COD sau khi xác nhận số tiền thực nhận và người/đơn vị giao nộp. Nếu Admin/provider không hỗ trợ thao tác thu tiền phù hợp, giữ payment ở trạng thái chưa thu và ghi phần chưa hỗ trợ; không sửa DB hay khẳng định đã thu.
6. Ghi audit trail tối thiểu gồm order ID, fulfillment ID, actor ID/role, trạng thái trước/sau, thời điểm và tham chiếu chứng cứ. Chỉ lưu dữ liệu khách tối thiểu cần cho giao hàng; không đưa địa chỉ, email, số điện thoại, token hoặc chứng từ có PII vào báo cáo.

## 5. Customer và kiểm soát truy cập

- Khách chỉ đọc đơn gắn với danh tính customer đã xác thực; không dùng order ID do client gửi làm bằng chứng quyền sở hữu.
- Trang order hiển thị fulfillment/payment tách biệt và đúng với response Medusa. Tracking chỉ hiện khi fulfillment chứa link/number hợp lệ; không giả định backend storefront hiện đã trả hoặc render các trường này.
- Staff/Admin dùng Admin API đã xác thực. Mọi giới hạn quyền Staff phải được enforce phía server và kiểm thử bằng tài khoản trái quyền; ẩn nút/menu hoặc login thành công không đủ.
- Kiểm thử truy cập chéo customer và role-negative của Staff là cổng nghiệm thu riêng, không được thay bằng kiểm tra source hoặc ảnh UI.

## 6. Khoảng trống triển khai cần nghiệm thu

- Walkthrough runtime nhập tồn → publish → order COD → fulfillment → tracking thủ công → customer status → COD reconciliation chưa chạy; xem [báo cáo walkthrough BE-05](../report/be-05-staff-walkthrough.md).
- Storefront hiện đọc và hiển thị hai thuộc tính `fulfillment_status` và `payment_status`; chưa có bằng chứng browser rằng tracking number/URL được trả và hiển thị cho khách.
- Quyền Staff khác Admin, ma trận được duyệt và test allow/deny thuộc BE-08; hiện chưa được chứng minh.
- Chưa có audit trail walkthrough với order/fulfillment IDs, actors và thời điểm thực. Không đánh dấu contract hoặc BE-05 là VERIFIED cho tới khi các mục này có bằng chứng.

## Tham chiếu

- [FLOW-05 — thanh toán và COD](../spec/02-flows.md#flow-05--payment-and-duplicate-handling)
- [FLOW-06 — kho và tồn kho](../spec/02-flows.md#flow-06--warehouse-and-inventory)
- [FLOW-07 — xử lý giao hàng và trạng thái đơn](../spec/02-flows.md#flow-07--fulfillment-and-order-status)
- [Permission Matrix Staff/Admin — BE-08](staff-admin-permission-matrix.md)
