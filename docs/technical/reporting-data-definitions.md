# DATA-04 — Định nghĩa dữ liệu báo cáo DAYMARK

Hợp đồng đối soát cho FR-09, FLOW-09 và AT-18. Hoàng dùng các định nghĩa này khi đọc số liệu cho Admin hoặc bản xuất. Quân dùng bộ dữ liệu mẫu để đối chiếu từng nhóm trạng thái và tổng. Việc duyệt quyền xem, ngưỡng tồn công bố và nguồn xác nhận thu COD theo OPEN-REPORT-001/OPEN-USR-011 thuộc về đại diện vận hành và chủ chính sách. [Kế hoạch DATA-04](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md) · [FLOW-09](../spec/02-flows.md#flow-09--administration-and-reporting) · [Sổ quyết định còn mở](../00-project/source-and-assumption-register.md)

## Kỳ báo cáo và nguồn đọc

- Dùng múi giờ `Asia/Ho_Chi_Minh`. Chuyển hai mốc nửa đêm địa phương sang UTC rồi lọc `start <= Order.created_at < end`. `end` là ngày kết thúc không bao gồm. Riêng ngày 20/11/2026 có khoảng UTC `[2026-11-19T17:00:00Z, 2026-11-20T17:00:00Z)`.
- Lấy một bản ghi cho mỗi `Order.id` đã tạo trong kỳ và có `created_at <= as_of`. Bỏ đơn nháp khi `is_draft_order` là `true` hoặc `status` là `draft`. Giá trị đơn, trạng thái đơn, tiến độ fulfillment và bằng chứng COD là trạng thái đọc tại thời điểm báo cáo. Ghi `as_of` cùng kỳ đã chọn để người xem biết số liệu có thể thay đổi khi đơn được sửa hoặc hủy. Tồn kho cũng là số đọc tại thời điểm báo cáo, độc lập với ngày tạo đơn. Dữ liệu hiện tại chưa dựng được trạng thái lịch sử tại cuối kỳ.
- Dùng Order projection do Medusa tính `total`, `currency_code`, `status` và `fulfillment_status`. Dùng Inventory cho tồn, Product và Stock Location cho danh mục và phạm vi kho. Lọc theo ngày và phân trang ổn định ở nguồn. Dùng workflow đọc danh sách đơn sẵn có hoặc các API và module service đọc được hỗ trợ. Dùng Query Graph và link cho các quan hệ cần đọc, giữ một dòng chuẩn cho mỗi đơn hoặc biến thể trước khi tổng hợp. Đọc COD theo `order.id`, `order_payment_collection`, payment thực tế và nguồn đối soát vận hành đã duyệt. Payment session bỏ dở chỉ là dữ liệu điều tra. [Nguồn Medusa và quan hệ](database-baseline.md#data-inventory)

## Chỉ số đơn hàng

| Chỉ số | Công thức và cách diễn giải |
| --- | --- |
| Số đơn theo trạng thái | `order_count` đếm `Order.id` duy nhất. `orders_by_status` chia theo `Order.status` và giữ riêng `pending`, `requires_action`, `completed`, `canceled` và `archived`. `orders_by_fulfillment_status` là chiều dữ liệu giao hàng riêng. `delivered` chỉ đơn đã giao đầy đủ theo dữ liệu đọc. |
| Đơn chờ xử lý hàng | `awaiting_fulfillment_order_count` đếm đơn có `Order.status` là `pending` hoặc `requires_action` và `fulfillment_status` là `not_fulfilled` hoặc `partially_fulfilled`. Đây là chỉ số đơn chờ chuẩn bị hàng theo các trạng thái xác định trong hợp đồng mẫu. |
| Giá trị đơn VND theo trạng thái | `orders_by_status.*.order_value_vnd` cộng `Order.total` của các đơn `currency_code = vnd` trong từng nhóm, tính theo nguyên đồng. `non_canceled_order_value_vnd` cộng các nhóm ngoài `canceled`. Giá trị nhóm `canceled` được giữ riêng để đối chiếu. `non_vnd_order_count` đếm đơn có tiền tệ khác, các đơn đó vẫn có mặt trong số lượng đơn theo trạng thái. |
| Đơn đổi/trả hoặc hoàn tiền | Giữ đơn ở trạng thái Order thực tế, đối chiếu hồ sơ Return và dấu vết Refund riêng theo ID đơn. Một đơn có thể có nhiều hồ sơ trả/hoàn. Giá trị đơn dùng `Order.total` theo phiên bản đang đọc. Khoản đã hoàn cần nguồn và chỉ số riêng. |

`Order.total` là **giá trị đơn** theo cách Medusa tính từ các thành phần của đơn. Báo cáo giữ nguyên VND theo đơn vị đồng và không gọi giá trị này là doanh thu hay tiền thu. Thu COD là một phép đối soát riêng. [Đặc tả FR-09](../spec/01-business.md) · [Quy tắc RULE-REPORT-001](../01-business/business-rules.md)

## Biến thể tồn thấp

Chọn một kho phục vụ phạm vi bán hàng và công bố `location_id`, ngưỡng tồn và giờ đọc. Chỉ tính các biến thể do Inventory quản lý. Dùng `stocked_quantity - reserved_quantity` tại mức tồn của từng `inventory_item_id` trong kho. Với mỗi thành phần bắt buộc của biến thể, lấy số đơn vị bán được bằng `floor(max(0, stocked_quantity - reserved_quantity) / required_quantity)`. Tồn bán được của cả biến thể là giá trị nhỏ nhất trong các thành phần bắt buộc. Đưa biến thể vào nhóm tồn thấp khi kết quả nhỏ hơn hoặc bằng ngưỡng, kể cả 0.

Đếm theo `variant_id`, trình bày SKU nếu có. Lượng đang nhập và tùy chọn backorder không làm tăng lượng sẵn có. Ghi riêng vào `stock_exceptions` khi thiếu link (`missing_inventory_link`), thiếu mức tồn ở kho chọn (`missing_inventory_level`) hoặc tồn khả dụng âm (`negative_available_quantity`). Số tồn âm vẫn được quy về 0 để phân loại tồn thấp. Các thành phần trùng hoặc có số lượng bất hợp lệ phải được kiểm tra trước khi tính. [Nguồn Inventory và link biến thể](database-baseline.md#erd-v3)

## Thu COD

Chỉ xét đơn hợp lệ trong kỳ và chưa hủy. Chuẩn hóa `payment_method` thành `cod`, `simulator` hoặc `unknown` từ giao dịch thanh toán thực tế của đơn hoặc phân loại nghiệp vụ được duyệt. Storefront hiện chọn `pp_system_default` cho COD. Dùng ID này làm dấu hiệu phương thức ở checkout DAYMARK, cùng `order.id` và liên kết tới payment đã sử dụng. Đơn COD ngoài VND cần đối soát vì hợp đồng này chỉ xác nhận thu bằng VND. [Chọn phương thức trong checkout](../../apps/storefront/src/lib/util/checkout-payment.ts) · [Quy tắc RULE-PAY-002](../01-business/business-rules.md)

| Phân loại | Điều kiện tại thời điểm báo cáo |
| --- | --- |
| Đã thu | `collected_order_count` đếm đơn có xác nhận thu đủ từ nguồn đối soát được vận hành phê duyệt. Hồ sơ cần khớp đơn, số VND dương bằng `Order.total`, mã tác nhân và tham chiếu chứng từ. Thời điểm xác nhận nằm trong khoảng từ lúc tạo đơn đến lúc đọc. `collected_amount_vnd` cộng số VND được xác nhận. |
| Chưa thu | `uncollected_order_count` đếm đơn có ghi nhận chưa thu hợp lệ với `amount_vnd = 0` hoặc đơn chưa có bản ghi đối soát dù nguồn có độ phủ đầy đủ. Nhãn nghiệp vụ có nghĩa là chưa có xác nhận thu. |
| Cần đối soát | `unknown_order_count` đếm đơn COD ngoài VND hoặc có nguồn đối soát thiếu, bằng chứng chưa đủ, xác nhận ngoài thời gian đọc, thu thiếu hay hoàn tiền chưa đối soát. Nhóm khác `unknown_method_order_count` ghi số đơn chưa xác định được phương thức. |

`payment_status`, authorization/capture của provider mặc định, kết quả mô phỏng và trạng thái giao hàng chỉ là dữ kiện kỹ thuật. Để xác nhận đã thu cần bằng chứng thu tiền từ nguồn trên. Nếu quy trình thực tế chưa cung cấp nguồn này, phần xác nhận COD trong báo cáo tích hợp vẫn cần đối soát. [Quy trình đối soát COD](../spec/06-operations.md) · [Ma trận quyền về thu tiền và báo cáo](staff-admin-permission-matrix.md)

## Kiểm tra bàn giao

Ảnh chụp dữ liệu mẫu lúc 00:05 ngày 21/11 cho các đơn tạo trong ngày 20/11/2026, giờ Việt Nam. Ngưỡng tồn mẫu là 3 tại kho được chọn. Cờ `cod_evidence_available` cho biết nguồn xác nhận sẵn sàng và có độ phủ đầy đủ cho nhóm đơn đang xét.

| Đối soát | Kết quả kỳ vọng |
| --- | --- |
| Số đơn và giá trị VND theo trạng thái | `pending` 4 / 769.000 ₫, `completed` 3 / 1.600.000 ₫, `requires_action` 1 / 180.000 ₫, `archived` 1 / 245.000 ₫, `canceled` 1 / 350.000 ₫. Tổng 10 đơn, gồm 1 đơn ngoài VND. Giá trị VND ngoài nhóm hủy là 2.794.000 ₫. |
| Giao hàng và chờ xử lý | 2 đơn đã giao đầy đủ. 5 đơn chờ xử lý hàng. |
| Tồn thấp | 3 biến thể với lượng bán được lần lượt 3, 2 và 0. Ba ngoại lệ là tồn âm, thiếu mức tồn tại kho được chọn và thiếu link Inventory. |
| COD | 1 đã thu đủ 480.000 ₫, 4 chưa thu, 2 cần đối soát, 1 chưa rõ phương thức. Khi nguồn xác nhận thu không có sẵn, cả 7 đơn COD đều cần đối soát. |

- Chạy `node scripts/check-reporting-fixture.mjs` tại thư mục gốc repo để tính lại và so với kết quả kỳ vọng. Bài kiểm tra dùng dữ liệu mẫu có định danh giả lập. Báo cáo trên Medusa Admin cần đối chiếu tích hợp riêng. [Fixture và kết quả kỳ vọng DATA-04](../report/fixtures/data-04-reporting.json)
- Hoàng nối các trường chuẩn hóa với dữ liệu Medusa, phạm vi kho và nguồn thu COD đã được phê duyệt. Truy vấn chỉ đọc nên xuất số tổng hợp và các ID nội bộ tối thiểu để đối chiếu. Quyền truy cập thực cần kiểm ở server theo FR-09 và ma trận Staff/Admin trước khi cấp cho người dùng.
- Quân đối chiếu Admin hoặc bản xuất với fixture trên một bộ dữ liệu bất biến, rồi ghi SHA, kỳ, thời điểm đọc, kho, ngưỡng, kết quả kỳ vọng/thực tế và nhóm thiếu hoặc sai dữ liệu theo AT-18. [Ca nghiệm thu quản trị và báo cáo](../03-requirements/use-case-specifications.md#p1-uc09--quản-trị-và-báo-cáo-cơ-bản)
