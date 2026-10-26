# ERD nghiệp vụ v2: Cart, Order, Payment và Inventory

Bản cập nhật ngày **25/10/2026** mở rộng ERD v1 thành **22 bảng và 30 quan hệ**: 12 cạnh FK vật lý, 8 cạnh stored module link và 10 cạnh ID/read-only reference. Có một trang tổng quan và ba trang chi tiết để đọc hết các liên kết mà không gom mọi đường nối vào một hình.

## 1. Mở sơ đồ

| Trang | SVG / PNG | Số bảng | Số cạnh |
| --- | --- | ---: | ---: |
| Tổng quan | [SVG](medusa-erd-v2-business.svg) / [PNG](medusa-erd-v2-business.png) | 22 | 22 cạnh chính |
| Cart–Order | [SVG](medusa-erd-v2-cart-order.svg) / [PNG](medusa-erd-v2-cart-order.png) | 10 | 14 |
| Payment | [SVG](medusa-erd-v2-payment.svg) / [PNG](medusa-erd-v2-payment.png) | 9 | 9 |
| Inventory | [SVG](medusa-erd-v2-inventory.svg) / [PNG](medusa-erd-v2-inventory.png) | 7 | 7 |

[File draw.io chỉnh sửa được](medusa-erd-v2-business.drawio) chứa đủ bốn trang. Mỗi bảng, cạnh và nhãn là đối tượng native; không phải ảnh được đặt vào canvas. Mở bằng diagrams.net/draw.io rồi chọn các tab trang ở phía dưới. Khi chèn vào báo cáo, dùng PNG; khi cần phóng to, dùng SVG.

Ba trang chi tiết bao phủ đủ R1–R30, mỗi quan hệ xuất hiện trên đúng một trang chi tiết. Bảng được lặp lại giữa các trang để đọc ngữ cảnh, không phải bảng mới. Tổng quan lược R4, R5, R10, R13, R14, R15, R25, R29; các cạnh này vẫn có đủ trong hình chi tiết và bảng quan hệ bên dưới.

## 2. Nguồn và phạm vi

- Medusa **2.21.2**; xem [phiên bản package đã cài](evidence/schema-survey-2026-10-24/source-versions.json).
- **20 bảng** trong hình dùng [catalog live PostgreSQL ngày 24/10/2026](evidence/schema-survey-2026-10-24/catalog.json), database local `commerce`, schema `public`, PostgreSQL 16.15.
- **Customer và Product** giữ nguồn từ [DDL v1](medusa-erd-v1.sql), snapshot database ngày **17/10/2026**. Hai bảng này chưa được thu thập trong catalog live 24 bảng; không khẳng định đã đọc lại chúng ngày 25/10.
- Bảng/cột/nullable được lấy theo database; ý nghĩa module link và hành vi được đối chiếu source đang cài. Xem [khảo sát schema](medusa-erd-v2-schema-survey.md) cho các khác biệt model–DDL.
- Đây là phạm vi nghiệp vụ chọn lọc. Address, Pricing, Region, Sales Channel, shipping, tax, provider, refund reason và các nghiệp vụ đổi trả không được vẽ đầy đủ. Một số ID ngoài phạm vi vẫn được giữ và ghi chú trong bảng.

| Nhóm | Bảng được thể hiện |
| --- | --- |
| Customer / catalog | `customer`, `product`, `product_variant` |
| Cart | `cart`, `cart_line_item` |
| Order | `order`, `order_item`, `order_line_item`, `order_cart`, `order_summary` |
| Payment | `payment_collection`, `payment_session`, `payment`, `cart_payment_collection`, `order_payment_collection`, `capture`, `refund` |
| Inventory / kho | `inventory_item`, `inventory_level`, `stock_location`, `product_variant_inventory_item`, `reservation_item` |

## 3. Cách đọc loại cạnh và cardinality

| Ký hiệu | Ý nghĩa |
| --- | --- |
| Xanh dương, nét liền — **FK** | PostgreSQL có constraint khóa ngoại thực sự |
| Xanh lá, nét chấm — **LINK** | Cặp ID được lưu trong bảng nối module; các cạnh LINK trong hình này không có FK |
| Nâu, nét đứt — **REF** | ID reference hoặc read-only module link; không có FK. R25 là quan hệ model; R29 là ID kho và R30 là ID dòng đơn được checkout sử dụng |
| `?` | Cột cho phép NULL trong database |
| `PK1`, `PK2` | Hai phần của PK ghép; không phải hai khóa chính độc lập |
| `UQ*` | Unique index áp dụng khi `deleted_at IS NULL` |
| `idx` | Index thường; không phải PK hoặc UNIQUE |

Số ở đầu cạnh cho biết số thực thể ở đầu đó cho mỗi thực thể đầu đối diện: `1` bắt buộc, `0..1` optional, `0..N` có thể không có hoặc có nhiều. Ví dụ Customer `0..1` — Cart `0..N`: một Cart có thể không gắn Customer; một Customer có nhiều Cart.

Với **LINK**, số `0..N` ở phía bảng nối mô tả số bản ghi link mà cấu trúc DB hiện cho phép, vì chỉ có PK cặp và không có UNIQUE riêng mỗi ID. Cardinality API của cặp thực thể gốc được ghi riêng ở mục 5; không suy ra Cart–Order là N:N về luồng checkout.

Với REF/LINK không có FK, số `1` chỉ thể hiện ID bắt buộc và liên kết dự kiến. NOT NULL không tự bảo đảm bản ghi đích tồn tại. R25 có `0..1*` vì unique chỉ áp dụng Payment chưa soft delete; toàn bộ lịch sử có thể nhiều Payment cho một session.

## 4. Đủ 30 quan hệ

Trong cột thứ hai, số đặt cạnh tên bảng là số lượng của bảng đó cho một bản ghi ở đầu đối diện. Trường nối luôn viết theo hướng `cột tham chiếu → id đích`.

| ID | Hai đầu cạnh và cardinality | Trường nối | Loại |
| --- | --- | --- | --- |
| R1 | `customer` **0..1** — `cart` **0..N** | `cart.customer_id → customer.id` | REF · read-only |
| R2 | `cart` **1** — `cart_line_item` **0..N** | `cart_line_item.cart_id → cart.id` | FK |
| R3 | `product` **0..1** — `product_variant` **0..N** | `product_variant.product_id → product.id` | FK |
| R4 | `product_variant` **0..1** — `cart_line_item` **0..N** | `cart_line_item.variant_id → product_variant.id` | REF · read-only |
| R5 | `product` **0..1** — `cart_line_item` **0..N** | `cart_line_item.product_id → product.id` | REF · read-only |
| R6 | `product_variant` **1** — `product_variant_inventory_item` **0..N** | `product_variant_inventory_item.variant_id → product_variant.id` | LINK |
| R7 | `inventory_item` **1** — `product_variant_inventory_item` **0..N** | `product_variant_inventory_item.inventory_item_id → inventory_item.id` | LINK |
| R8 | `inventory_item` **1** — `inventory_level` **0..N** | `inventory_level.inventory_item_id → inventory_item.id` | FK |
| R9 | `stock_location` **1** — `inventory_level` **0..N** | `inventory_level.location_id → stock_location.id` | REF · read-only |
| R10 | `customer` **0..1** — `order` **0..N** | `order.customer_id → customer.id` | REF · read-only |
| R11 | `order` **1** — `order_item` **0..N** | `order_item.order_id → order.id` | FK |
| R12 | `order_line_item` **1** — `order_item` **0..N** | `order_item.item_id → order_line_item.id` | FK |
| R13 | `order_item` **0..1** — `order_line_item` **0..N** | `order_line_item.totals_id → order_item.id` | FK · legacy |
| R14 | `product_variant` **0..1** — `order_line_item` **0..N** | `order_line_item.variant_id → product_variant.id` | REF · read-only |
| R15 | `product` **0..1** — `order_line_item` **0..N** | `order_line_item.product_id → product.id` | REF · read-only |
| R16 | `order` **1** — `order_summary` **0..N** | `order_summary.order_id → order.id` | FK |
| R17 | `order` **1** — `order_cart` **0..N** | `order_cart.order_id → order.id` | LINK |
| R18 | `cart` **1** — `order_cart` **0..N** | `order_cart.cart_id → cart.id` | LINK |
| R19 | `cart` **1** — `cart_payment_collection` **0..N** | `cart_payment_collection.cart_id → cart.id` | LINK |
| R20 | `payment_collection` **1** — `cart_payment_collection` **0..N** | `cart_payment_collection.payment_collection_id → payment_collection.id` | LINK |
| R21 | `order` **1** — `order_payment_collection` **0..N** | `order_payment_collection.order_id → order.id` | LINK |
| R22 | `payment_collection` **1** — `order_payment_collection` **0..N** | `order_payment_collection.payment_collection_id → payment_collection.id` | LINK |
| R23 | `payment_collection` **1** — `payment_session` **0..N** | `payment_session.payment_collection_id → payment_collection.id` | FK |
| R24 | `payment_collection` **1** — `payment` **0..N** | `payment.payment_collection_id → payment_collection.id` | FK |
| R25 | `payment_session` **1** — `payment` **0..1*** | `payment.payment_session_id → payment_session.id` | REF · model-reference |
| R26 | `payment` **1** — `capture` **0..N** | `capture.payment_id → payment.id` | FK |
| R27 | `payment` **1** — `refund` **0..N** | `refund.payment_id → payment.id` | FK |
| R28 | `inventory_item` **1** — `reservation_item` **0..N** | `reservation_item.inventory_item_id → inventory_item.id` | FK |
| R29 | `stock_location` **1** — `reservation_item` **0..N** | `reservation_item.location_id → stock_location.id` | REF · plain-id |
| R30 | `order_line_item` **0..1** — `reservation_item` **0..N** | `reservation_item.line_item_id → order_line_item.id` | REF · checkout-id |

R1–R9 giữ nguyên ý nghĩa từ v1. R13 là FK lịch sử còn tồn tại trong DB. 12 FK trên là các cạnh **trong phạm vi hình 22 bảng**; không phải số FK của toàn database hay số 19 FK trong khảo sát 24 bảng có thêm các tham chiếu ngoài hình.

## 5. PK ghép và cardinality API của các bảng nối

| Bảng nối | PK vật lý | Ý nghĩa nghiệp vụ / API |
| --- | --- | --- |
| `order_cart` | `(order_id, cart_id)` | `order.cart` và `cart.order` singular; có thể chưa có liên kết |
| `cart_payment_collection` | `(cart_id, payment_collection_id)` | `cart.payment_collection` và `collection.cart` singular; optional khi chưa khởi tạo thanh toán |
| `order_payment_collection` | `(order_id, payment_collection_id)` | `order.payment_collections` là list; `collection.order` singular |
| `product_variant_inventory_item` | `(variant_id, inventory_item_id)` | ProductVariant **N:N** InventoryItem; có `required_quantity` trên link |

Cả bốn bảng có thêm `id` NOT NULL, nhưng `id` chỉ có index thường, không phải PK và không có UNIQUE riêng. PK cặp ngăn lặp đúng một cặp; không ép mỗi ID xuất hiện một lần, không tự kiểm tra bản ghi ở hai module và không cưỡng chế các singular của API.

## 6. Các điểm cần giữ khi đọc hoặc chỉnh sơ đồ

### Cart và Order

- `cart_line_item` giữ số lượng trong giỏ; `quantity` kiểu integer.
- `order_item` giữ `order_id`, `item_id`, `version`, `quantity` numeric và tiến độ xử lý. Đọc lượng của đơn hiện tại phải dùng đúng version.
- `order_line_item` giữ snapshot sản phẩm/giá; không có cột `order_id` hoặc `quantity`. Chuỗi chính là `order → order_item → order_line_item`.
- R12 và R13 là hai quan hệ độc lập. `order_item.item_id` không UNIQUE; `order_line_item.totals_id` nullable và không UNIQUE. Không gộp thành cạnh 1:1.
- `order_summary` có nhiều dòng theo version; không vẽ thành 1:1 cố định.

### Payment

- `payment` không có cột `status`; trạng thái nằm trong `payment_collection.status` và `payment_session.status`.
- `payment.payment_session_id` NOT NULL và unique active, nhưng không có FK tới session. Đây là R25 màu nâu, không phải nét FK xanh dương.
- Order đã tạo không tự chứng minh payment đã capture. Capture và Refund là các bản ghi con riêng của Payment.
- Provider và RefundReason nằm ngoài hình; các cột reference không được tự gắn thêm FK.

### Inventory và Reservation

- ProductVariant và InventoryItem là N:N qua bảng nối; `required_quantity` là định mức inventory item cho mỗi đơn vị variant.
- `inventory_level` lưu tồn theo cặp `(inventory_item_id, location_id)`; cặp này unique khi level chưa xóa.
- Ở mức một item/kho: **available = stocked − reserved**. `available_quantity` là giá trị tính, không phải cột vật lý. Không cộng `incoming_quantity`.
- Trong complete-cart, `reservation_item.line_item_id` là ID OrderLineItem đã tạo, không phải CartLineItem. Reservation có thể được tạo cho mục đích khác nên cột này optional.
- R29 và R30 là plain/checkout ID references, không có khai báo read-only link riêng trong bộ definitions đã khảo sát. Legend REF bao gồm các loại này.
- Không có `inventory_level_id` trên ReservationItem; không thêm cạnh FK giả Reservation→InventoryLevel. Đối chiếu level bằng cặp item/kho.
- Theo source, lượng giữ = lượng đặt × `required_quantity`; tạo reservation tăng reserved, không trực tiếp giảm stocked ở bước đó. Đây là đối chiếu source, chưa phải kết quả thử checkout.

## 7. Kiểm tra artifact và cách tái tạo

[Biên bản kiểm tra](evidence/erd-v2-validation-2026-10-25.json) ghi kiểm tra tên trường, nullability/cardinality, phân loại FK, độ phủ 30 quan hệ, đường nối tránh nội dung bảng và bố trí nhãn. SVG/XML, kích thước PNG và file draw.io đã được kiểm tra; các ảnh đã được xem để kiểm tra khả năng đọc.

[Manifest sơ đồ](medusa-erd-v2-graph.json) lưu bảng, cột chọn lọc, quan hệ, cardinality và tọa độ. [Mã tạo sơ đồ](generate-erd-v2.py) tạo các SVG/PNG/draw.io từ cùng định nghĩa; dùng Python, Pillow và font Arial/Consolas trên Windows. Chạy từ repository root:

```powershell
python docs/erd/generate-erd-v2.py
```

Lệnh tạo lại ghi các artifact do generator quản lý và đặt trạng thái visual review thành pending để kiểm tra ảnh mới. Chỉnh native draw.io trực tiếp không tự cập nhật ngược manifest hoặc SVG/PNG do generator sinh.

Công việc ERD v2 không thay đổi schema/database, không chạy seed/migration/checkout và giữ nguyên các file ERD v1. **Inventory Consistency Notes** sẽ được hoàn thiện bằng một lần thử riêng có baseline và bằng chứng trước/sau tạo đơn.
