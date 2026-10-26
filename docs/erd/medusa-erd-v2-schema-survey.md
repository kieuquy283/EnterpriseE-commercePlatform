# Khảo sát schema tuần 3: Cart, Order, Payment và Inventory

Đã kiểm tra trực tiếp database local của dự án và đối chiếu các model, module link, workflow trong Medusa **2.21.2** đang cài. Tài liệu này hoàn thành bước khảo sát cấu trúc, làm đầu vào cho ERD v2 và kế hoạch kiểm tra tồn kho trước/sau tạo đơn.

## 1. Phạm vi và bằng chứng

| Nội dung | Kết quả đã xác nhận |
| --- | --- |
| Thời điểm đọc database | **24/10/2026 17:01:13, Asia/Saigon**; JSON ghi `2026-10-24T10:01:13.994317+00:00` |
| Môi trường | PostgreSQL local trong container `enterprisee-commerceplatform-postgres-1` |
| Database / schema | `commerce` / `public` |
| PostgreSQL | **16.15** |
| Medusa cài trong dự án | Các package được đối chiếu đều **2.21.2**; xem [source-versions.json](evidence/schema-survey-2026-10-24/source-versions.json) |
| Phạm vi chọn lọc | **24 bảng, 318 cột, 24 PK, 19 FK, 3 CHECK, 108 index**; 33 index unique đã bao gồm 24 index PK |
| Phương thức | Đọc PostgreSQL catalog trong transaction `REPEATABLE READ READ ONLY`; xác nhận `transaction_read_only = on` |
| Bằng chứng gốc | [catalog.json](evidence/schema-survey-2026-10-24/catalog.json) |
| Truy vấn có thể chạy lại | [medusa-erd-v2-schema-readonly.sql](medusa-erd-v2-schema-readonly.sql) |

24 bảng là phạm vi được chọn để trả lời các câu hỏi tuần 3, không phải toàn bộ database hay toàn bộ bốn module. Ngoài bảng lõi có thêm các bảng nối và bảng hỗ trợ như `product_variant`, `stock_location`, provider, refund reason và order summary.


### Đối chiếu với dump ngày 17/10/2026

Đã so sánh 24 bảng với snapshot `C:/Users/hn845/Downloads/medusa-schema-actual.sql`:

- 318 tên cột, kiểu PostgreSQL cơ sở (`udt_name`) và nullability khớp.
- 46 định nghĩa constraint gồm 24 PK, 19 FK và 3 CHECK tương đương. Ba CHECK khác cách in dấu ngoặc giữa dump và `pg_get_constraintdef(..., true)`, nhưng cùng điều kiện và danh sách giá trị.
- 84 index ngoài PK khớp sau chuẩn hóa khoảng trắng, schema prefix và dấu nháy identifier.
- So sánh này không bao gồm SQL DEFAULT của từng cột, độ dài/precision đầy đủ của kiểu dữ liệu, lịch sử migration hoặc dữ liệu trong bảng.

## 2. Quy ước đọc

- `?` sau tên cột: database cho phép NULL. Các cột được liệt kê không có `?` là NOT NULL trong catalog tại thời điểm đọc.
- Bảng entity dưới đây dùng `id text` làm PK và có `created_at`, `updated_at`, `deleted_at`. Các bảng nối được ghi PK riêng ở mục 4.
- Các trường `raw_*` dạng JSONB đi kèm tiền/số lượng phục vụ cách Medusa lưu số chính xác; không phải một khoản tiền hoặc lượng hàng độc lập.
- **FK vật lý** là constraint PostgreSQL thực sự kiểm tra. **Stored module link** lưu cặp ID ở bảng nối. **ID tham chiếu** có thể được source/Medusa dùng để truy vấn module khác nhưng không có FK trong database này.
- Cardinality nghiệp vụ của API/model và cardinality được database cưỡng chế được ghi riêng; một thuộc tính API dạng singular không tự tạo UNIQUE/FK trong database.

## 3. Tên bảng và cột quan trọng

### 3.1. Cart — giỏ chứa gì, số lượng bao nhiêu?

| Model / bảng thực tế | Cột quan trọng theo database hiện tại | Vai trò |
| --- | --- | --- |
| `Cart` / `cart` | `id` PK; `currency_code text`; `customer_id?`, `region_id?`, `sales_channel_id?`; `email?`; `shipping_address_id?`, `billing_address_id?`; `completed_at?` | Ngữ cảnh giỏ hàng. Không có cột `status`; `completed_at` cho biết giỏ đã hoàn tất hay chưa |
| Cart `LineItem` / `cart_line_item` | `id` PK; `cart_id text`; `title text`; `quantity integer`; `unit_price numeric`, `raw_unit_price jsonb`; `variant_id?`, `product_id?`; `variant_sku?`; `is_custom_price boolean` | Dòng hàng và snapshot thông tin/giá trong giỏ |

Quan hệ **Cart 1 → 0..N CartLineItem** qua FK `cart_line_item.cart_id → cart.id`. Mỗi dòng bắt buộc thuộc một Cart. CHECK hiện có là `unit_price >= 0`; không suy ra database có CHECK dương cho `quantity`.

`customer_id` nullable cho phép giỏ chưa gắn customer. `product_id` và `variant_id` trên dòng hàng là ID tham chiếu, không có FK tới Product Module. Không tạo bảng mới tên `cart_item` để khớp nhãn nghiệp vụ CartItem.



### 3.2. Order — đơn từ giỏ nào, gồm những dòng hàng nào?

| Model / bảng thực tế | Cột quan trọng theo database hiện tại | Vai trò |
| --- | --- | --- |
| `Order` / `order` | `id` PK; `display_id integer?`; `version integer` DEFAULT 1; `status order_status_enum` DEFAULT `pending`; `currency_code text`; `is_draft_order boolean` DEFAULT false; `customer_id?`, `region_id?`, `sales_channel_id?`; `canceled_at?` | Đơn hàng và phiên bản hiện tại |
| `OrderItem` / `order_item` | `id` PK; `order_id text`; `item_id text`; `version integer`; `quantity numeric`, `raw_quantity jsonb`; các `fulfilled_quantity`, `shipped_quantity`, `delivered_quantity`, lượng return/written-off; `unit_price?` | Gắn dòng hàng vào đơn; giữ số lượng và tiến độ xử lý theo phiên bản |
| `OrderLineItem` / `order_line_item` | `id` PK; `title text`; `product_id?`, `variant_id?`, `variant_sku?`; `unit_price numeric`, `raw_unit_price jsonb`; `totals_id text?` | Snapshot sản phẩm/giá của dòng đơn. **Không có `order_id` hoặc `quantity`** |
| `OrderSummary` / `order_summary` | `id` PK; `order_id text`; `version integer` DEFAULT 1; `totals jsonb?` | Snapshot tổng hợp theo phiên bản; một đơn có thể có nhiều summary |

Chuỗi quan hệ vật lý cần giữ khi vẽ ERD:

```text
order.id ← order_item.order_id
order_item.item_id → order_line_item.id
order_summary.order_id → order.id
```

`order_item.item_id` không UNIQUE, nên một `order_line_item` có thể được nhiều bản ghi `order_item` tham chiếu. Khi đọc lượng của đơn hiện tại cần dùng đúng version; không cộng tất cả các phiên bản. Source repository có logic lọc theo version của đơn.

Trong database còn FK nullable **`order_line_item.totals_id → order_item.id`**. Đây là quan hệ vật lý tồn tại cần ghi nhận; không thay thế chuỗi `order → order_item → order_line_item` ở trên.

Đơn được tạo từ giỏ nào: đọc bảng **`order_cart`**, không tìm cột `cart_id` trên bảng `order`.


### 3.3. Payment — liên kết và trạng thái thanh toán ở đâu?

| Model / bảng thực tế | Cột quan trọng theo database hiện tại | Vai trò |
| --- | --- | --- |
| `PaymentCollection` / `payment_collection` | `id` PK; `currency_code text`; `amount numeric`, `raw_amount jsonb`; `authorized_amount?`, `captured_amount?`, `refunded_amount?` cùng `raw_*?`; `status text`; `completed_at?` | Nhóm thanh toán và trạng thái tổng hợp |
| `PaymentSession` / `payment_session` | `id` PK; `payment_collection_id text`; `provider_id text`; `currency_code text`; `amount numeric`, `raw_amount jsonb`; `status text`; `authorized_at?`; `data jsonb`; `context?` | Phiên xử lý với provider; lưu trạng thái phiên |
| `Payment` / `payment` | `id` PK; `payment_collection_id text`; `payment_session_id text`; `provider_id text`; `amount numeric`, `raw_amount jsonb`; `currency_code text`; `captured_at?`, `canceled_at?`; `data?` | Bản ghi thanh toán. **Không có cột `status`** |
| `Capture` / `capture` | `id` PK; `payment_id text`; `amount numeric`, `raw_amount jsonb`; `created_by?` | Các lần capture tiền của payment |
| `Refund` / `refund` | `id` PK; `payment_id text`; `amount numeric`, `raw_amount jsonb`; `refund_reason_id?`; `note?`, `created_by?` | Các lần hoàn tiền |
| `RefundReason` / `refund_reason` | `id` PK; `label text`, `code text`; `description?`, `metadata?` | Danh mục lý do hoàn tiền |
| `PaymentProvider` / `payment_provider` | `id` PK; `is_enabled boolean` DEFAULT true | Provider được đăng ký trong module |

Quan hệ nội bộ có FK thật:

- PaymentCollection **1 → 0..N** PaymentSession qua `payment_session.payment_collection_id`.
- PaymentCollection **1 → 0..N** Payment qua `payment.payment_collection_id`.
- Payment **1 → 0..N** Capture và **1 → 0..N** Refund qua `payment_id`.
- PaymentCollection và PaymentProvider nối N:N qua bảng có FK thật `payment_collection_payment_providers`.

Những quan hệ không có FK trong database này:

- `payment.payment_session_id`: NOT NULL và có UNIQUE khi payment chưa xóa (`deleted_at IS NULL`), nhưng **không có FK tới `payment_session`**. Model khai báo quan hệ với session; database chỉ cưỡng chế nullability và unique active ở cột này.
- `refund.refund_reason_id`: nullable, có index thường, không có FK tới `refund_reason`.
- `payment.provider_id`, `payment_session.provider_id`: cột text NOT NULL, không có FK tới `payment_provider`.

Cart liên kết PaymentCollection qua `cart_payment_collection`; Order liên kết qua `order_payment_collection`. Không có `cart_id`/`order_id` trực tiếp trên bảng `payment` để thay thế các link này.



### 3.4. Inventory — hàng ở kho nào, bao nhiêu đã được giữ?

| Model / bảng thực tế | Cột quan trọng theo database hiện tại | Vai trò |
| --- | --- | --- |
| `InventoryItem` / `inventory_item` | `id` PK; `sku?`, `title?`; `requires_shipping boolean` DEFAULT true; `unit_of_measure?` | Đơn vị hàng được quản lý tồn. Không lưu trực tiếp các cột `stocked_quantity`/`reserved_quantity` |
| `InventoryLevel` / `inventory_level` | `id` PK; `inventory_item_id text`, `location_id text`; `stocked_quantity`, `reserved_quantity`, `incoming_quantity`: numeric NOT NULL DEFAULT 0; ba `raw_* jsonb?` | Tồn kho của một item tại một location |
| `ReservationItem` / `reservation_item` | `id` PK; `inventory_item_id text`, `location_id text`; `quantity numeric`; `line_item_id?`; `allow_backorder boolean?` DEFAULT false; `raw_quantity jsonb?`; `external_id?` | Lượng giữ hàng cho một order line hoặc mục đích khác |
| `StockLocation` / `stock_location` | `id` PK; `name text`; `address_id?`, `metadata?` | Kho/địa điểm lưu hàng |
| `ProductVariant` / `product_variant` | `id` PK; `title text`; `sku?`, `product_id?`; `manage_inventory boolean` DEFAULT true; `allow_backorder boolean` DEFAULT false | Cấu hình bán của variant; liên kết item qua bảng `product_variant_inventory_item` |

Các quan hệ:

- InventoryItem **1 → 0..N** InventoryLevel và **1 → 0..N** ReservationItem: có FK thật qua `inventory_item_id`.
- Mỗi InventoryLevel có `location_id` bắt buộc, nhưng không có FK sang StockLocation; source khai báo read-only module link. `reservation_item.location_id` cũng không có FK sang StockLocation.
- `reservation_item.line_item_id` nullable, không có FK. Trong luồng complete-cart hiện tại, ID này lấy từ **OrderLineItem đã tạo**, không phải CartLineItem. Reservation tạo cho mục đích khác có thể không gắn order line.
- ProductVariant và InventoryItem là **N:N** qua `product_variant_inventory_item`. `required_quantity` là lượng inventory item dùng cho mỗi đơn vị variant, không phải số tồn hiện tại.

Tồn có thể bán ở mức **một inventory item tại một kho**:

```text
available_quantity = stocked_quantity - reserved_quantity
```

Không có cột vật lý `inventory_level.available_quantity`; Medusa tính giá trị này. `incoming_quantity` không được cộng vào lượng có thể bán. Khả dụng cuối cùng của một variant còn phụ thuộc sales channel/location, các item cấu thành, `required_quantity`, `manage_inventory` và `allow_backorder`.


## 4. Sáu bảng nối trong phạm vi

| Bảng thực tế | PK thực tế | Cardinality nghiệp vụ / API | PostgreSQL cưỡng chế |
| --- | --- | --- | --- |
| `order_cart` | `(order_id, cart_id)` | `order.cart` và `cart.order` dạng singular; quan hệ có thể chưa tồn tại, đặc biệt draft order/giỏ chưa complete | Unique theo cặp PK; **không FK**, không UNIQUE riêng mỗi phía |
| `cart_payment_collection` | `(cart_id, payment_collection_id)` | `cart.payment_collection` và phía collection.cart dạng singular, optional khi chưa tạo payment collection | Unique theo cặp PK; **không FK**, không UNIQUE riêng mỗi phía |
| `order_payment_collection` | `(order_id, payment_collection_id)` | `order.payment_collections` dạng list, phía collection.order singular | Unique theo cặp PK; **không FK**, không UNIQUE riêng mỗi phía |
| `product_variant_inventory_item` | `(variant_id, inventory_item_id)` | N:N; có `required_quantity numeric` NOT NULL DEFAULT 1 | Unique theo cặp PK; **không FK** tới variant/item |
| `region_payment_provider` | `(region_id, payment_provider_id)` | N:N giữa region và provider | Unique theo cặp PK; **không FK** |
| `payment_collection_payment_providers` | `(payment_collection_id, payment_provider_id)` | N:N nội bộ Payment Module | **Có FK thật tới cả hai bảng** |

Năm bảng stored module link ở trên có thêm `id varchar` NOT NULL nhưng `id` **không phải PK** và không có UNIQUE riêng. Riêng `payment_collection_payment_providers` chỉ có hai cột ID, không có `id` hoặc timestamps.

Sơ đồ vật lý của các link không có FK chỉ thể hiện bảng/cột và PK. Nếu ERD nghiệp vụ nối các cạnh này, phải chú thích module link, không gắn nhãn FK. PK cặp chỉ ngăn lặp cặp ID, không tự bảo đảm quan hệ 1:1 như API/model expose.


## 5. Trạng thái và ràng buộc đáng chú ý

| Trường | Kiểu / mặc định | Giá trị cho phép đã xác nhận |
| --- | --- | --- |
| `order.status` | PostgreSQL enum; DEFAULT `pending` | `pending`, `completed`, `draft`, `archived`, `canceled`, `requires_action` |
| `payment_collection.status` | text + CHECK; DEFAULT `not_paid` | `not_paid`, `awaiting`, `authorized`, `partially_authorized`, `canceled`, `failed`, `partially_captured`, `completed` |
| `payment_session.status` | text + CHECK; DEFAULT `pending` | `authorized`, `captured`, `pending`, `requires_more`, `error`, `canceled`, `pending_authorization` |

`cart` không có `status`; `payment` cũng không có `status`. Trạng thái tổng hợp được API trả về không nhất thiết là một cột cùng tên trong database. Việc đã có Order không tự chứng minh thanh toán đã capture.

Các unique index quan trọng áp dụng khi `deleted_at IS NULL`:

- `inventory_item.sku` unique; SKU nullable.
- `inventory_level(inventory_item_id, location_id)` unique, tối đa một level chưa xóa cho một item/kho.
- `payment.payment_session_id` unique, tối đa một payment chưa xóa cho một session.
- `stock_location.address_id` unique; address nullable.
- `product_variant.sku`, `barcode`, `ean`, `upc` có unique index riêng; đều nullable.

Không có CHECK chống âm trên quantity của các bảng inventory được khảo sát. Kiểm tra khả dụng/backorder được thực hiện ở service/workflow, không suy ra từ một DB CHECK không tồn tại.



### 19 FK đã quan sát

| Cột nguồn | Bảng/cột đích | Số FK |
| --- | --- | ---: |
| `cart.billing_address_id`, `cart.shipping_address_id` | `cart_address.id` | 2 |
| `cart_line_item.cart_id` | `cart.id` | 1 |
| `order.billing_address_id`, `order.shipping_address_id` | `order_address.id` | 2 |
| `order_item.order_id` | `order.id` | 1 |
| `order_item.item_id` | `order_line_item.id` | 1 |
| `order_line_item.totals_id` | `order_item.id` | 1 |
| `order_summary.order_id` | `order.id` | 1 |
| `payment_session.payment_collection_id`, `payment.payment_collection_id` | `payment_collection.id` | 2 |
| `capture.payment_id`, `refund.payment_id` | `payment.id` | 2 |
| Hai cột của `payment_collection_payment_providers` | `payment_collection.id`, `payment_provider.id` | 2 |
| `inventory_level.inventory_item_id`, `reservation_item.inventory_item_id` | `inventory_item.id` | 2 |
| `stock_location.address_id` | `stock_location_address.id` | 1 |
| `product_variant.product_id` | `product.id` | 1 |

Tất cả có `ON UPDATE CASCADE`. Bốn FK địa chỉ của Cart/Order có `ON DELETE SET NULL`; 15 FK còn lại có `ON DELETE CASCADE`. Có sáu FK tham chiếu tới bảng ngoài phạm vi 24 bảng: hai địa chỉ Cart, hai địa chỉ Order, địa chỉ kho và Product.

## 6. Khác biệt model/source với schema thực tế

Các khác biệt dưới đây cũng đã tồn tại trong dump 17/10 và được xác nhận lại ở database hiện tại. Chưa đủ căn cứ gọi chúng là lỗi hoặc tự thay đổi schema.

| Điểm đối chiếu | Model/source 2.21.2 | Database hiện tại | Cách ghi vào ERD/tài liệu |
| --- | --- | --- | --- |
| `order_line_item.unit_price` | `bigNumber().nullable()` | numeric NOT NULL; `raw_unit_price` cũng NOT NULL | Từ điển vật lý giữ NOT NULL, chú thích khác model |
| `order_line_item.totals_id` | Model hiện tại không khai báo trường này; migration ban đầu vẫn tạo cột và FK | Cột text nullable, FK tới `order_item.id` vẫn tồn tại | Giữ cạnh trong ERD vật lý, ghi là cấu trúc lịch sử |
| `order_summary.totals` | `model.json()` không `.nullable()` | jsonb nullable | Ghi theo database, chú thích model hiện tại |
| `reservation_item.allow_backorder`, `raw_quantity` | Model không đánh dấu nullable | Hai cột cho phép NULL | Ghi nullability thực tế; không tự thêm NOT NULL |
| `inventory_level.raw_*` | Migration `20241213063611` thêm `raw_*` NOT NULL với `IF NOT EXISTS` | Ba cột raw_* nullable | `ADD COLUMN IF NOT EXISTS` không đổi nullability của cột đã có; chưa audit migration history để kết luận nguyên nhân |

Ngoài ra, default ở model/ORM không luôn hiện thành SQL DEFAULT. Ví dụ `order_item.version` có `.default(1)` trong source nhưng catalog không có SQL DEFAULT; nhiều cột lượng xử lý cũng khác cách khai báo default numeric/raw. Khi tạo dữ liệu, dùng Medusa service/workflow để hệ thống quản lý các trường này.


## 7. Điểm nối sang Inventory Consistency Notes

Theo source complete-cart 2.21.2, sau khi tạo order và dòng order, workflow thực hiện song song việc tạo các link, đánh dấu cart hoàn tất và reserve inventory; sau đó mới authorize payment. Step reserve dùng `line_item_id` của OrderLineItem và lượng cần giữ bằng:

```text
reservation quantity = order item quantity × required_quantity
```

Service tạo reservation làm tăng `reserved_quantity`, không trực tiếp giảm `stocked_quantity` ở bước này; có compensation xóa reservation khi workflow rollback. Đây là kết quả đọc source, chưa phải bằng chứng một ca checkout thành công hoặc rollback thực tế trong lần khảo sát này.

Khi chạy bước kiểm tra trước/sau, cần lưu cùng `inventory_item_id` và `location_id`, các cờ inventory/backorder, `required_quantity`, số lượng đặt, order/line/reservation IDs và ba số stocked/reserved/incoming. Dùng đúng `order_item.version` khi đọc lượng hàng của đơn. Không dùng số seed cũ làm baseline hiện tại và không đánh đồng order được tạo với payment đã capture.
