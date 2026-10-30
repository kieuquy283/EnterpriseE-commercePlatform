# Inventory Consistency Notes — Task 3, tuần 3

**Kết quả: ĐẠT cho lần checkout local bằng script TypeScript, mua 2 đơn vị.** Script chạy qua `medusa exec`, tạo Order thật qua Store API, đọc lại Order và lưu đủ snapshot T0/T1/T2. **24/24 kiểm tra tự động đạt.** Stocked giữ ở 25; reserved tăng từ 4 lên 6; available giảm từ 21 xuống 19.

## 1. Mục tiêu và môi trường

Kiểm tra inventory trước/sau hoàn tất checkout tạo Order, bổ sung bằng chứng còn thiếu của task 3 tuần 3. Snapshot trước/sau seed giỏ của tuần 2 chỉ phản ánh giai đoạn giỏ hàng; lần này thu baseline mới trong cùng một lần chạy.

| Nội dung | Giá trị thực tế |
| --- | --- |
| Run ID | `ts-20261026-order-01` |
| Thời gian chạy | 26/10/2026, **16:03:56.261–16:04:01.151 UTC+07** (Asia/Saigon) |
| Cách chạy | `medusa exec ./src/scripts/check-inventory-order.ts ts-20261026-order-01` qua npm script |
| Backend | `http://127.0.0.1:9000`, local/development |
| Database | PostgreSQL local, database `commerce`, host `localhost`, cổng `15432` |
| Phiên bản | Medusa, JS SDK, Inventory, Order, Payment, Core Flows đều **2.21.2**; Node.js **v24.21.0** |
| Đọc snapshot | Medusa module services và `query.graph`; chọn các trường cần đối chiếu |
| Thao tác ghi | Store SDK/API tạo cart, cart item, shipping method, payment session và complete cart; API dùng workflow Medusa |
| Fulfillment | Chưa tạo fulfillment, chưa ship/deliver |

Bằng chứng: [environment.json](evidence/inventory-order-ts-20261026-order-01/environment.json), [manifest.json](evidence/inventory-order-ts-20261026-order-01/manifest.json), [api-trace.json](evidence/inventory-order-ts-20261026-order-01/api-trace.json).

## 2. Kiểm kê và chuẩn bị dữ liệu

Dữ liệu hiện có đủ điều kiện nên đã tái sử dụng product, variant, inventory item, kho, region, giá, shipping và provider local. Không chạy lại seed, không reset tồn, không tạo sẵn Order hoặc Reservation. Script tạo một cart mới riêng trong lần chạy.

| Thuộc tính fixture | Giá trị |
| --- | --- |
| Product / SKU | `ao-thun-essential` / `TEE-ESSENTIAL-BLK` |
| Số lượng mua | **2** |
| `manage_inventory` / `allow_backorder` | `true` / `false` |
| Liên kết inventory | Một InventoryItem, một inventory level tại một kho |
| `required_quantity` | **1**; lượng giữ kỳ vọng = `2 × 1 = 2` |
| Kho | Vietnam Warehouse |
| Region / kênh bán / tiền tệ | Vietnam / Online Store / VND |
| Giá đơn vị qua Store API | **249,000 VND** |
| Shipping option | Standard delivery |
| Payment provider | `pp_system_default`, provider thử nghiệm local |
| Tồn ban đầu | stocked **25**, reserved **4**, incoming **0**, available **21** |

Bằng chứng: [fixture.json](evidence/inventory-order-ts-20261026-order-01/fixture.json), [preflight-inventory.json](evidence/inventory-order-ts-20261026-order-01/preflight-inventory.json). Fixture đủ hàng để mua 2 đơn vị, giữ nguyên 4 đơn vị đã được các giao dịch trước giữ chỗ.

## 3. Trình tự thực hiện

1. Chạy TypeScript qua `medusa exec`. Medusa nạp cấu hình/container; script xác nhận local, backend hoạt động, variant quản lý inventory, tắt backorder, một link inventory và đủ hàng.
2. Đọc giá/provider qua Store SDK; kiểm tra product và kho thuộc Online Store. Chụp **T0 trước tạo cart** bằng service/query của Medusa.
3. Tạo cart mới có metadata `sample_suite=week3_inventory_order`, `sample_run=ts-20261026-order-01`; thêm variant quantity 2. Cập nhật địa chỉ/email giả phục vụ checkout, chọn Standard delivery, khởi tạo payment collection/session.
4. Chụp **T1 sau chuẩn bị checkout, ngay trước complete cart**. Xác nhận cart chưa completed, một dòng quantity 2; inventory và reservation cũ không đổi. Session đang `pending`, collection `not_paid`, chưa có Payment cho cart này.
5. Gọi `sdk.store.cart.complete(cartId)` một lần. Response trả `type=order`; lưu Order ID vào manifest và completion receipt.
6. Chụp **T2 sau nhận Order ID**. Đọc Order với item của version hiện tại, module links, Payment/Reservation; gọi Store API lấy lại cùng Order ID.
7. Tính delta, chạy 24 kiểm tra, lưu JSON/CSV, trace và bản source TypeScript đã thực thi trong cùng thư mục evidence.

Không dùng SQL để tạo/sửa Order, Payment, Reservation hoặc số tồn. Seed tuần 2, nội dung task 1 và ERD v2 của task 2 được giữ nguyên.

## 4. Snapshot và chênh lệch inventory

Cả ba mốc đọc cùng `inventory_item_id` và `location_id`. `available_quantity = stocked_quantity - reserved_quantity`.

| Mốc | Khoảng đọc ngày 26/10/2026, UTC+07 | stocked | reserved | incoming | available |
| --- | --- | ---: | ---: | ---: | ---: |
| T0 — trước tạo cart | 16:03:56.632–16:03:56.732 | 25 | 4 | 0 | 21 |
| T1 — trước complete cart | 16:04:00.144–16:04:00.265 | 25 | 4 | 0 | 21 |
| T2 — sau nhận Order ID | 16:04:00.865–16:04:01.064 | 25 | 6 | 0 | 19 |
| Δ T0 → T1 | Thao tác giỏ, chuẩn bị checkout | 0 | 0 | 0 | 0 |
| Δ T1 → T2 | Hoàn tất checkout tạo Order | 0 | **+2** | 0 | **−2** |

`captured_at`/`capture_finished_at` là thời điểm bắt đầu/kết thúc đọc theo đồng hồ Node.js host, lưu UTC trong JSON/CSV. Lời gọi complete bắt đầu **16:04:00.269**, hoàn tất **16:04:00.861** theo trace, nằm giữa T1 và T2.

Đọc qua service diễn ra tuần tự và **không dùng chung một transaction nguyên tử giữa các module**. Báo cáo dựa vào thứ tự thực thi/khoảng đọc local; không dùng `created_at`/`updated_at` từ database để suy thứ tự giữa các nguồn đồng hồ.

Bằng chứng: [T0](evidence/inventory-order-ts-20261026-order-01/t0.json), [T1](evidence/inventory-order-ts-20261026-order-01/t1.json), [T2](evidence/inventory-order-ts-20261026-order-01/t2.json), [inventory-timeline.csv](evidence/inventory-order-ts-20261026-order-01/inventory-timeline.csv).

T0/T1 có **2 reservation cũ**, tổng quantity **4** tại level đã chọn. Hai bản ghi giữ nguyên ở T2; thêm đúng một reservation quantity 2. Hai inventory level khác giữ nguyên. Gap `reserved_quantity − tổng quantity reservation` của level là **0** ở cả ba mốc.

| Mốc | Active Cart | Active CartLineItem | Active Order | Active Payment |
| --- | ---: | ---: | ---: | ---: |
| T0 | 5 | 7 | 2 | 2 |
| T1 | 6 | 8 | 2 | 2 |
| T2 | 6 | 8 | 3 | 3 |

## 5. ID của fixture và giao dịch

| Đối tượng | ID |
| --- | --- |
| Product | `prod_01M5555A9JAW58WJYFPXC2JFM4` |
| Variant | `variant_01M5555ACK1K0YCMWJ7XXSVYSA` |
| InventoryItem | `iitem_01M5555AD6JTJMAN2JGAMFBJD6` |
| InventoryLevel | `ilev_01M5555AFDZ3H78XH3Q132NXJ5` |
| StockLocation | `sloc_01M5555A4F96W5XBT8FJGE2EG4` |
| Region | `reg_01M5555A2ZAPR5SYW3THXG2SVC` |
| SalesChannel | `sc_01M5555A0N5T656VFQ874BGK26` |
| ShippingOption | `so_01M5555A7RBPXR2DQFGJV32EGR` |
| Cart | `cart_01M5VQ7G8JR2H68GAQRP96JR41` |
| CartLineItem | `cali_01M5VQ7GT38712DSJDAX3K307P` |
| Order — version 1 | `order_01M5VQ7KFZJNCP690YV4PV8VQF` |
| OrderItem | `orditem_01M5VQ7KG2MTWFPKRNQYF4YVQ2` |
| OrderLineItem | `ordli_01M5VQ7KG16VN1187M4X1X2HJ1` |
| Reservation mới | `resitem_01M5VQ7KMDW25KAQRVJ64B8JD9` |
| PaymentCollection | `pay_col_01M5VQ7JZ1JFM830BJBJ463YY3` |
| PaymentSession | `payses_01M5VQ7K3EQMJRFXZZSTGNCACE` |
| Payment | `pay_01M5VQ7KP6CF4YM0TNTJH75Y3B` |

Reservation có trước và được giữ nguyên: `resitem_01M5SQSC2P4ZG98WHBTQTW0G83` và `resitem_01M5T8GVGJ99A5XPZJVWY6E8AX`, mỗi bản ghi quantity 2.

## 6. Đối chiếu Order, Payment và Reservation

Order trả từ checkout và Order đọc lại qua Store API cùng ID ở bảng trên, `status=pending`, `version=1`, tiền tệ VND, một item đúng variant, quantity **2**, unit price **249,000**. Cart có `completed_at`; module link nối đúng cart/order.

Trong Medusa 2.21.2, `items[].id` là **OrderLineItem**; `items[].detail.id` là **OrderItem**. Script kiểm tra `detail.version = order.version = 1`, `detail.order_id = Order ID`, `detail.item_id = OrderLineItem ID`. Quantity được đối chiếu theo OrderItem của version hiện tại. `reservation.line_item_id` bằng **OrderLineItem ID**, cùng inventory item, kho, quantity `2 × 1 = 2`. Các ID được đọc từ dữ liệu thật, không seed sẵn.

Cart và Order cùng liên kết một PaymentCollection. T2: collection/session đều **`authorized`**; Payment liên kết đúng session/provider, amount **528,000 VND**, `canceled_at=null`. Collection có `authorized_amount=528000`, `captured_amount=0`, `refunded_amount=0`; Payment `captured_at=null`; không capture/refund. Đây là authorize của provider local, chưa chứng minh đã thu tiền. Lần thử không kiểm toán riêng phân bổ tổng tiền giữa hàng, shipping và tax.

Không có fulfillment link; `fulfilled_quantity`, `shipped_quantity`, `delivered_quantity` đều **0**. Order mới vẫn giữ **2 đơn vị** để review; không tự hủy hoặc giải phóng reservation sau khi thu bằng chứng.

Bằng chứng: [completion-receipt.json](evidence/inventory-order-ts-20261026-order-01/completion-receipt.json), [order-api-readback.json](evidence/inventory-order-ts-20261026-order-01/order-api-readback.json), [T2](evidence/inventory-order-ts-20261026-order-01/t2.json).

## 7. Kết quả kiểm tra

| Kiểm tra | Mong đợi | Thực tế | Kết quả |
| --- | --- | --- | --- |
| Cùng run/fixture | Cùng run/item/kho T0/T1/T2 | Khớp cả ba | Đạt |
| T0 trước tạo cart | Chưa tạo cart/order của lần thử | Chụp trước lời gọi tạo cart | Đạt |
| T0 → T1 inventory | Tất cả level không đổi | 3 level giữ nguyên | Đạt |
| T0 → T1 reservation | Không tăng giữ hàng | 2 reservation cũ giữ nguyên | Đạt |
| T0 → T1 Order | Không tạo Order | Δ = 0 | Đạt |
| Cart tại T1 | Một item quantity 2, chưa completed | Đúng variant/run/quantity | Đạt |
| T1 → T2 stocked | Δ = 0 | 25 → 25 | Đạt |
| T1 → T2 reserved | Δ = +2 | 4 → 6 | Đạt |
| T1 → T2 available | Δ = −2 | 21 → 19 | Đạt |
| T1 → T2 incoming | Δ = 0 | 0 → 0 | Đạt |
| Level khác | Giữ nguyên | 2 level giữ nguyên | Đạt |
| Reservation cũ | Giữ nguyên các trường đã chụp | 2 bản ghi giữ nguyên | Đạt |
| OrderItem hiện tại | Version 1, đúng variant, quantity 2 | Khớp Order | Đạt |
| Reservation mới | Đúng OrderLineItem/item/kho, quantity 2 | Một bản ghi khớp | Đạt |
| Link Order–Cart | Nối đúng cart/order | Một link khớp | Đạt |
| Số Order mới | Δ = +1 | 2 → 3 | Đạt |
| Cart completed | Có `completed_at` | Đã ghi nhận | Đạt |
| Fulfillment | Chưa fulfillment/ship/deliver | Không link, quantity = 0 | Đạt |
| Store API readback | Khớp ID/version/item/variant/quantity/currency | Khớp | Đạt |
| Link collection | Cart và Order dùng cùng collection | Khớp | Đạt |
| Link Payment–Session | Một payment authorize đúng provider/session/collection | Khớp | Đạt |
| Amount/currency | Collection/session/payment khớp | 528,000 VND; authorized 528,000 | Đạt |
| Capture/refund | Chưa capture/refund | Amount 0, không bản ghi, `captured_at=null` | Đạt |
| Gap reserved/reservation | Bảo toàn gap | 0 → 0 | Đạt |

Giá trị expected/actual của toàn bộ kiểm tra nằm trong [validation.json](evidence/inventory-order-ts-20261026-order-01/validation.json): **24/24 đạt**, `all_passed=true`.

## 8. Source, kiểm tra mã và chạy lại

Source backend: [check-inventory-order.ts](../../apps/backend/src/scripts/check-inventory-order.ts), [snapshot.ts](../../apps/backend/src/scripts/inventory-order/snapshot.ts), [validation.ts](../../apps/backend/src/scripts/inventory-order/validation.ts). Bản đúng thời điểm thực thi được lưu tại [evidence/source](evidence/inventory-order-ts-20261026-order-01/source/check-inventory-order.ts). Đây là bản lưu trữ để review; chạy từ repository bằng source backend để nạp đúng cấu hình/container và tìm đúng evidence.

Typecheck và build backend **đạt**; lint đi kèm build có **0 lỗi, 0 cảnh báo**. [code-validation.json](evidence/inventory-order-ts-20261026-order-01/code-validation.json) lưu kết quả lệnh và đối chiếu SHA của ba file source với bản lưu trữ.

Từ gốc repository, khi PostgreSQL/Redis local sẵn sàng, mở backend ở terminal riêng:

```powershell
npm run backend:dev
```

Chỉ kiểm kê, chưa tạo cart/order; dùng một run ID mới cho preflight:

```powershell
npm run backend:check:inventory-order -- ts-new-preflight preflight
```

Chạy đầy đủ với một run ID mới khác:

```powershell
npm run backend:check:inventory-order -- ts-new-order
```

Lệnh đầy đủ tạo Order thật và giữ thêm 2 đơn vị. Script từ chối dùng lại thư mục run đã tồn tại, kể cả run dở hoặc preflight, để tránh chạy lại ngoài ý muốn. Nếu lỗi, đọc manifest/failure trước khi quyết định lần chạy tiếp; không tự complete lại cart hoặc reset tồn. Đổi run ID ví dụ nếu đã dùng chúng.

## 9. Kết luận và giới hạn

Trong ca mua 2 đơn vị, một variant/item/kho, không backorder và chưa fulfillment, inventory nhất quán với checkout: giỏ không tăng reservation; tạo Order giữ đúng 2 đơn vị, giữ nguyên stocked/incoming, giảm available tương ứng. Baseline reserved **4** cùng hai reservation cũ được bảo toàn; không giả định reserved ban đầu bằng 0.

Kết quả áp dụng cho lần thử local thành công này. Snapshot đọc service tuần tự; không có thao tác kho khác được chủ động chạy đồng thời, nhưng bằng chứng không chứng minh tính nguyên tử giữa module hoặc loại trừ mọi thay đổi tạm thời ngoài khoảng đọc. Chưa kiểm tra checkout đồng thời/overselling, rollback khi lỗi, hủy đơn, capture, fulfillment, backorder, bundle hoặc nhiều kho. Số đếm/so sánh chỉ xét dữ liệu active do service trả về.

Số liệu CJS từ các lần thử trước không thay baseline của run TypeScript này. Xem [danh mục bằng chứng](evidence/inventory-order-ts-20261026-order-01/README.md). Báo cáo/evidence không chứa secret, token, password hoặc connection string.
