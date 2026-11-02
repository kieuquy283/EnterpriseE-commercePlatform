# SOFTWARE REQUIREMENTS SPECIFICATION

> **Functional · Business Rules · Data · Interfaces · NFR · Verification**

**PHIÊN BẢN** 1.0 – Bản thảo hoàn chỉnh phục vụ review nhóm     **|     NGÀY**  02/11/2026

**HỆ THỐNG:** Enterprise E-commerce Platform · Medusa v2 / Next.js / PostgreSQL / Redis

**BASELINE CODE:** main d0bf45a; recommendation a98457c (đánh giá độc lập)

**TÌNH TRẠNG:** Chưa có xác nhận phê duyệt stakeholder; các mục tiêu đề xuất chưa phải số đo đã đạt.

> Tài liệu học thuật cho nhóm phát triển hệ thống bán lẻ giả định; không phải hợp đồng với doanh nghiệp thực tế.

## 1. Giới thiệu và phạm vi

### 1.1 Mục đích

Tài liệu SRS-03 quy định các yêu cầu có thể kiểm chứng cho production-oriented MVP của Enterprise E-commerce Platform. Độc giả: nhóm phát triển, QA, DevOps, giảng viên/hội đồng review. Nội dung mô tả “hệ thống phải làm gì” và “cách xác nhận”, không tự coi mọi chức năng trong danh sách là đã hoàn thành. [SRC-01, SRC-02]

### 1.2 Baseline và trạng thái

Baseline source kiểm tra: main d0bf45a, recommendation a98457c, ngày 02/11/2026. Medusa 2.21.2, Next.js 15, PostgreSQL 16, Redis 7 và npm workspaces. CI/API tests trên main pass ngày 01/11/2026. recommendation có Playwright/E2E và H&M ETL artifacts; code chưa đồng bộ hết với main. [SRC-03..10]

SRS v1.0 là bản thảo hoàn chỉnh để review, chưa có biên bản phê duyệt stakeholder hay báo cáo đạt mọi NFR. Việc thay đổi business rules, target workloads, availability và monthly budget phải qua change control. Requirement status và implementation status tách riêng để tránh “đã có code = đã nghiệm thu”.

### 1.3 Quy ước yêu cầu và thuật ngữ

| **Mã / thuật ngữ** | **Giải thích** |
| --- | --- |
| M / S / C | M = Must (bắt buộc); S = Should (ưu tiên); C = Could (optional). |
| CODE / TEST / PARTIAL / GAP | Có triển khai / có evidence kiểm thử / một phần / chưa có đủ source/evidence. |
| Medusa | Nền tảng backend quản lý commerce: product, pricing, cart, order, inventory, payment. |
| Storefront | Next.js customer-facing UI, không là nguồn dữ liệu commerce. |
| Order vs Payment | Order được tạo không đồng nghĩa tiền đã capture/thu, nhất là COD. |
| RPS / p95 | Requests per second / phân vị thứ 95 của thời gian phản hồi. |
| RPO / RTO | Recovery Point Objective / Recovery Time Objective. |
| Idempotency | Lặp lại cùng hành động có cùng hiệu quả nghiệp vụ, tránh side effect trùng. |
| Evidence | Test output, logs, dashboard, readback, commit, timestamp và môi trường được định danh. |

## 2. Product context, actors và ranh giới

Sản phẩm phục vụ một business scenario bán lẻ Việt Nam. Actor: Customer, Store/Operations Staff, Administrator và Developer/DevOps (vận hành). Customer dùng Next.js; Admin/Staff dùng Medusa Admin. Next.js gọi Medusa Store API bằng publishable API key và auth context. Medusa quản lý business entities, PostgreSQL persistence và Redis infrastructure. Có service worker riêng trong Docker Compose; event/subscriber doanh nghiệp chưa hoàn chỉnh. [SRC-03]

| **Thành phần** | **Trách nhiệm chính** | **Không chịu trách nhiệm** |
| --- | --- | --- |
| Browser / Next.js | UI, navigation, input UX, cart/auth cookies, SDK calls. | Không thực thi order/payment/inventory authoritative logic. |
| Medusa API/Admin | Authz, product, prices, cart, checkout, orders, payment, inventory. | Không giao quyền tạo Order trực tiếp cho frontend. |
| Medusa Worker & Redis | Cache/event/workflow/locking, async handlers khi triển khai. | Không là request HTTP hop nối tiếp DB. |
| PostgreSQL | System of record cho commerce và dữ liệu extension nếu có. | Không lưu raw ML transactions thành orders. |
| Cloud DevOps | Container deployment, TLS, observability, backups, costs. | Không mặc định cung cấp multi-AZ HA với 1 VM. |

## 3. Functional Requirements (FR)

Tổng cộng 42 yêu cầu chức năng được định nghĩa theo actor, hành động, điều kiện, tiêu chí xác nhận và liên kết evidence. Mỗi requirement là một đơn vị có thể giao việc/test độc lập; nhóm phải cập nhật status sau khi chạy các test mới. Chú giải “TEST” chỉ ghi nhận evidence từng phần trên baseline, không tự suy ra full acceptance.

### 3.1 Identity & Access

#### FR-AUTH-01  [M]  Customer có thể đăng ký tài khoản bằng email/password và tạo customer profile.

Business/validation rule: Email hợp lệ/không trùng; mật khẩu chỉ qua Auth provider.

Acceptance: Tạo account mới; thử duplicate/invalid; API không rò secret.

**Trạng thái:** CODE/TEST  |  **Tuần:** 5  |  **Nguồn/test:** Medusa auth/store routes; checkout integration

#### FR-AUTH-02  [M]  Customer đăng nhập/đăng xuất; token/session chỉ nhận sau xác thực thành công.

Business/validation rule: Bảo vệ session phía server; invalid credential từ chối.

Acceptance: Đăng nhập đúng/sai; logout vô hiệu session ở UI; không tự xem order người khác.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 5,11  |  **Nguồn/test:** Storefront auth flow; browser E2E trên recommendation

#### FR-AUTH-03  [M]  Customer chỉ xem/sửa hồ sơ, order, địa chỉ của chính mình.

Business/validation rule: Authorization ở Medusa, không chỉ UI.

Acceptance: Thử Customer A truy cập Order B: từ chối/không lộ dữ liệu.

**Trạng thái:** PARTIAL  |  **Tuần:** 5,11  |  **Nguồn/test:** Store API and auth tests, bổ sung authz negative

#### FR-AUTH-04  [M]  Admin/Operations được xác thực và thao tác theo vai trò được Medusa hỗ trợ.

Business/validation rule: Không dùng Customer token cho Admin APIs.

Acceptance: Admin không đăng nhập thì không vào Admin; privilege boundary được kiểm thử.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 5,11  |  **Nguồn/test:** Medusa Admin, cần RBAC review

### 3.2 Product Catalog, Search & Pricing

#### FR-CAT-01  [M]  Storefront hiển thị published products, phân trang và empty state.

Business/validation rule: Chỉ sản phẩm thuộc kênh/region phù hợp được bán.

Acceptance: Trang /vn/store phân trang đúng; product unpublished không được coi là bán được.

**Trạng thái:** CODE/TEST  |  **Tuần:** 5  |  **Nguồn/test:** apps/storefront/src/modules/store/templates/index.tsx

#### FR-CAT-02  [M]  Product Detail hiển thị thông tin, variant, giá và ảnh/placeholder hợp lệ.

Business/validation rule: Không suy đoán size hay tồn kho từ dữ liệu nguồn.

Acceptance: PDP hiển thị lựa chọn variant và giá cho Vietnam region.

**Trạng thái:** CODE/TEST  |  **Tuần:** 5,9  |  **Nguồn/test:** Product UI & Medusa Store Product API

#### FR-CAT-03  [M]  Customer tìm kiếm sản phẩm theo từ khóa với kết quả hợp lệ.

Business/validation rule: Giới hạn query và phân trang; không bắt buộc dedicated engine.

Acceptance: Từ khóa có/không kết quả, pagination hoạt động; error state hợp lý.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 5,9  |  **Nguồn/test:** /store/products?q, catalog route

#### FR-CAT-04  [M]  Price hiển thị theo VND/region do Medusa định giá; UI không tính giá authoritative.

Business/validation rule: Price/currency thuộc Medusa Pricing.

Acceptance: Giá ở catalog, cart, checkout phù hợp phản hồi Medusa; không dùng giá H&M làm VND thật.

**Trạng thái:** CODE/TEST  |  **Tuần:** 5–7  |  **Nguồn/test:** seed-commerce, storefront price helpers

#### FR-CAT-05  [S]  Category/collection/filter/sort nhất quán với catalog thực.

Business/validation rule: Không hiển thị category không có data.

Acceptance: Chọn category/sort/filter trả đúng tập item; documented fallback.

**Trạng thái:** PARTIAL  |  **Tuần:** 5,9  |  **Nguồn/test:** Store templates, category components

### 3.3 Shopping Cart

#### FR-CART-01  [M]  Người dùng tạo hoặc tiếp tục cart gắn đúng region.

Business/validation rule: Cart state thuộc Medusa, cart cookie thuộc storefront.

Acceptance: Cart mới/hiện có được dùng đúng, không lẫn account.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6  |  **Nguồn/test:** apps/storefront/src/lib/data/cart.ts

#### FR-CART-02  [M]  Người dùng thêm, cập nhật số lượng và xóa line item.

Business/validation rule: Quantity nguyên dương; server xác thực giá/tồn.

Acceptance: Add→quantity=2→remove→empty state, tổng tiền đúng.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6  |  **Nguồn/test:** Cart Store API, browser E2E trên recommendation

#### FR-CART-03  [M]  Cart phản ánh pricing, shipping, tax và line totals do Medusa trả.

Business/validation rule: Không tự đồng bộ giá riêng tại frontend.

Acceptance: Tổng tiền checkout khớp với Medusa response.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 6  |  **Nguồn/test:** Cart/checkout pages, integration test

#### FR-CART-04  [M]  Invalid variant/quantity/stock được xử lý an toàn.

Business/validation rule: Không tạo orphan line items hoặc order khi invalid.

Acceptance: API báo lỗi hợp lệ và cart vẫn nhất quán.

**Trạng thái:** PARTIAL  |  **Tuần:** 6,7  |  **Nguồn/test:** Cần negative integration tests

### 3.4 Checkout & Order Creation

#### FR-CHK-01  [M]  Checkout yêu cầu email, địa chỉ giao/billing và shipping method hợp lệ.

Business/validation rule: Chỉ options do Medusa trả được chọn.

Acceptance: Thiếu dữ liệu không cho place order; invalid shipping bị từ chối.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6  |  **Nguồn/test:** Checkout components; integration test

#### FR-CHK-02  [M]  Checkout tạo Payment Collection/Session với provider hợp lệ.

Business/validation rule: Provider ID phải được đăng ký/enabled; simulator non-prod.

Acceptance: Không chọn provider sai hoặc session invalid để complete.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6,7  |  **Nguồn/test:** Store API /payment-collections

#### FR-CHK-03  [M]  Khi hoàn tất cart thành công, trả một Order ID và confirmation.

Business/validation rule: Chỉ response type=order là thành công.

Acceptance: Order có item/amount/currency; order detail/history đọc lại được.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6  |  **Nguồn/test:** checkout-order.spec.ts, order pages

#### FR-CHK-04  [M]  Checkout thất bại phải hiển thị lỗi, không redirect sang confirmation và không xóa cart như thành công.

Business/validation rule: Error handling không giả order.

Acceptance: Thử lỗi completion: không có success redirect; cart có thể xử lý tiếp.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 6,7  |  **Nguồn/test:** payment-button, Playwright on recommendation

### 3.5 Payment and Idempotency

#### FR-PAY-01  [M]  Hỗ trợ phương thức thủ công/COD cho demo Việt Nam.

Business/validation rule: Authorization không đồng nghĩa capture/thu tiền thật.

Acceptance: Chọn COD tạo payment session và order demo; trạng thái giải thích đúng.

**Trạng thái:** CODE/TEST  |  **Tuần:** 7  |  **Nguồn/test:** pp_system_default, checkout sequence

#### FR-PAY-02  [M]  Simulator dev/test mô phỏng thành công và thất bại; từ chối ở production.

Business/validation rule: Provider chỉ enabled ngoài production; không xử lý tiền/thẻ.

Acceptance: Success tạo Order, failure không tạo Order; prod config không đăng ký provider.

**Trạng thái:** CODE/TEST  |  **Tuần:** 7  |  **Nguồn/test:** payment-simulator/provider.ts; checkout-order.spec.ts

#### FR-PAY-03  [M]  Duplicate complete-cart/retry không tạo thêm Order ngoài ý muốn.

Business/validation rule: Idempotency theo cart/identity/payload hoặc cơ chế Medusa đã được xác minh.

Acceptance: 2 concurrent requests + retry timeout → tối đa 1 Order; mismatch payload không cross-authorize.

**Trạng thái:** GAP  |  **Tuần:** 7  |  **Nguồn/test:** Cần tests + ADR + readback

#### FR-PAY-04  [M]  Payment failure không biến thành order success và không thay đổi reservation ngoài ý muốn.

Business/validation rule: Medusa kiểm soát workflow/compensation.

Acceptance: Simulator failure → HTTP error, 0 order_cart links, inventory snapshot unchanged.

**Trạng thái:** CODE/TEST  |  **Tuần:** 7  |  **Nguồn/test:** checkout-order.spec.ts

#### FR-PAY-05  [S]  Ghi rõ các trạng thái authorize/capture/refund và trách nhiệm nhận tiền COD.

Business/validation rule: Không gọi order pending là đã thu tiền.

Acceptance: Report/UI phân biệt authorized/captured/refunded; state transitions rõ.

**Trạng thái:** PARTIAL  |  **Tuần:** 7  |  **Nguồn/test:** Provider + inventory report

### 3.6 Inventory

#### FR-INV-01  [M]  Khi Order hợp lệ được tạo, availability/reservation thay đổi đúng lượng.

Business/validation rule: Không double-decrement stocked hoặc double-reserve.

Acceptance: T0/T1/T2 readback match order quantity và inventory links.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6,7  |  **Nguồn/test:** inventory-consistency-notes.md 24/24

#### FR-INV-02  [M]  Không bán vượt số tồn hợp lệ trong concurrent checkout.

Business/validation rule: Concurrency và stock management thuộc Medusa.

Acceptance: 2+ concurrent checkouts gần hết stock không oversell.

**Trạng thái:** GAP  |  **Tuần:** 7,12  |  **Nguồn/test:** Cần concurrency/failure test

#### FR-INV-03  [S]  Hủy/fulfill order cập nhật reservation và stock theo workflow hỗ trợ.

Business/validation rule: Không sửa trực tiếp stock tables.

Acceptance: Cancel/fulfill tests đối soát delta trước/sau.

**Trạng thái:** GAP  |  **Tuần:** 7,8  |  **Nguồn/test:** Cần order state tests

### 3.7 Order & Tracking

#### FR-ORD-01  [M]  Customer xem danh sách đơn và chi tiết đơn của mình.

Business/validation rule: Không xem Order của tài khoản khác.

Acceptance: Create Order rồi detail/list cùng ID; negative access test.

**Trạng thái:** CODE/TEST  |  **Tuần:** 6,8  |  **Nguồn/test:** checkout-order.spec.ts

#### FR-ORD-02  [M]  Có order status và khả năng theo dõi trạng thái tối thiểu.

Business/validation rule: Chỉ hiển thị trạng thái từ Medusa.

Acceptance: Order history/detail phản ánh trạng thái thực tại các thời điểm demo.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 8  |  **Nguồn/test:** Order pages, cần state change E2E

#### FR-ORD-03  [S]  Nhân viên thao tác fulfillment/order qua Medusa Admin có kiểm soát.

Business/validation rule: Không tạo status giả riêng ở frontend.

Acceptance: Thao tác staff/admin được kiểm chứng bằng role và readback.

**Trạng thái:** PARTIAL  |  **Tuần:** 8,11  |  **Nguồn/test:** Medusa Admin built-in; cần access test

### 3.8 Event & Notification

#### FR-NOT-01  [M]  Order placement phát domain event hợp lệ và worker xử lý notification ngoài request checkout.

Business/validation rule: Notification failure không rollback Order.

Acceptance: Sau Order, worker tạo notification attempt; Order tồn tại độc lập.

**Trạng thái:** GAP  |  **Tuần:** 8  |  **Nguồn/test:** Redis event + worker infra, custom subscriber thiếu

#### FR-NOT-02  [M]  Notification retry có giới hạn/backoff và chặn gửi trùng cùng sự kiện.

Business/validation rule: Có idempotency/attempt IDs, failure log.

Acceptance: Mô phỏng provider lỗi rồi hồi phục: retry đúng quy tắc, không duplicate bừa bãi.

**Trạng thái:** GAP  |  **Tuần:** 8  |  **Nguồn/test:** Cần subscriber/adapter và test

#### FR-NOT-03  [S]  Khách được gửi email xác nhận đơn trên test/sandbox adapter.

Business/validation rule: Không gửi email production từ dữ liệu demo không consent.

Acceptance: Kiểm tra message được nhận qua sandbox/log sink và chứa Order ref tối thiểu.

**Trạng thái:** GAP  |  **Tuần:** 8  |  **Nguồn/test:** Cần email adapter

### 3.9 Administration

#### FR-ADM-01  [M]  Admin quản lý product, variant, inventory và orders bằng Medusa Admin.

Business/validation rule: Admin authentication và authorization bắt buộc.

Acceptance: Duyệt/sửa product và theo dõi order trên Admin trong staging.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 5–8  |  **Nguồn/test:** Medusa Admin, manual verification

#### FR-ADM-02  [S]  Báo cáo vận hành cơ bản: orders/status/errors/low stock.

Business/validation rule: Không coi authorized COD là revenue đã thu.

Acceptance: Dashboard/SQL-read evidence phân biệt captured và authorized.

**Trạng thái:** GAP  |  **Tuần:** 8,11  |  **Nguồn/test:** Cần minimal report

### 3.10 Cache, Search & Media

#### FR-INT-01  [M]  Cache hot catalog/read model có chiến lược key/TTL/invalidation và fallback an toàn.

Business/validation rule: Dữ liệu checkout/pricing luôn lấy trạng thái Medusa hợp lệ.

Acceptance: Hit/miss + update product không trả stale vượt policy, Redis failure không trả sai order.

**Trạng thái:** PARTIAL  |  **Tuần:** 9  |  **Nguồn/test:** Redis cache configured, test thiếu

#### FR-INT-02  [M]  Media product dùng object storage/file provider phù hợp và không lưu image blob ở transactional DB.

Business/validation rule: Asset rights và URL availability được xác minh.

Acceptance: Upload hoặc serve media từ storage trong staging, thumbnail hoạt động.

**Trạng thái:** PARTIAL  |  **Tuần:** 9  |  **Nguồn/test:** S3 optional config, chưa có run evidence

#### FR-INT-03  [S]  Search/filter/sort đáp ứng nhu cầu browsing và có kiến trúc đồng bộ khi tách search service.

Business/validation rule: Dedicated service cần ADR chứ không auto requirement.

Acceptance: Document decision, reindex/invalidation test nếu dùng service.

**Trạng thái:** PARTIAL  |  **Tuần:** 9  |  **Nguồn/test:** Keyword search, no dedicated search

### 3.11 Operations

#### FR-OPS-01  [M]  Pipeline CI thực hiện test, lint, typecheck và build trước merge/release.

Business/validation rule: Fail gate không cho merge theo branch policy được duyệt.

Acceptance: Evidence workflow pass trên commit baseline.

**Trạng thái:** CODE/TEST  |  **Tuần:** 10  |  **Nguồn/test:** CI & API GitHub Actions runs 01/11

#### FR-OPS-02  [M]  Triển khai staging cloud được tái lập, có TLS, migration và readiness gate.

Business/validation rule: Secrets không commit Git; version deployed traceable.

Acceptance: Từ commit approved deploy staging, health + checkout cloud E2E pass.

**Trạng thái:** PARTIAL  |  **Tuần:** 10  |  **Nguồn/test:** deploy.yml + RUNBOOK; no cloud evidence

#### FR-OPS-03  [M]  Có rollback code/config và backup/restore DB được diễn tập.

Business/validation rule: Không rollback migration mất dữ liệu.

Acceptance: Restore staging và rollback release thành công, có timestamps/logs.

**Trạng thái:** GAP  |  **Tuần:** 10,12  |  **Nguồn/test:** RUNBOOK target only

#### FR-OPS-04  [M]  Có app logs, metrics request/error/p95/resource và alert cho sự cố chính.

Business/validation rule: Logs không chứa secrets/PII.

Acceptance: Dashboard/alert screenshots và fault test trigger.

**Trạng thái:** GAP  |  **Tuần:** 11  |  **Nguồn/test:** Docker logs configured, metrics gap

### 3.12 Recommendation (Optional)

#### FR-REC-01  [C]  ETL H&M giữ ID mapping và data provenance, không tạo pseudo-orders trong Medusa.

Business/validation rule: Tuân thủ competition rules/asset rights.

Acceptance: Pilot mapping valid; không trùng SKU; offline artifacts không lộ lên public.

**Trạng thái:** CODE/PARTIAL  |  **Tuần:** 13+  |  **Nguồn/test:** scripts/hm, README ghi pilot 500/1.874

#### FR-REC-02  [C]  Recommendation trả catalog items hợp lệ qua Store API sau khi core ổn định.

Business/validation rule: Filter published/region/price/stock; fallback popularity.

Acceptance: API/UI có tests; offline metrics và serving latency được đo.

**Trạng thái:** GAP  |  **Tuần:** 13+  |  **Nguồn/test:** Không có online rec API ở baseline

## 4. Business Rules (BR)

Quy tắc nghiệp vụ có tính bắt buộc hoặc là mục tiêu kiểm thử dựa trên plan. Khi kế hoạch chưa có implementation, quy tắc vẫn được giữ và đánh dấu cần chứng minh. Các thay đổi phải cập nhật SRS, test và ADR.

| **ID** | **Quy tắc nghiệp vụ** | **Nguồn / hướng xác nhận** |
| --- | --- | --- |
| BR-01 | Chỉ Medusa tạo/đổi giá authoritative, Cart, Order, Payment và Inventory. | [SRC-03], storefront/backend boundary. |
| BR-02 | Sản phẩm chỉ mua được khi published, thuộc channel/region, có giá và inventory policy hợp lệ. | Medusa Product/Inventory. |
| BR-03 | Mọi item trong Order phải tham chiếu product/variant có thật hoặc snapshot hợp lệ do Medusa tạo. | Cart completion workflow. |
| BR-04 | Đặt hàng thành công chỉ khi Medusa trả `type=order`, có Order ID và có thể truy vấn lại. | Checkout action & tests. |
| BR-05 | Payment `authorized` ≠ tiền đã thu; COD chỉ là phương thức thanh toán khi nhận. | Payment simulator và order report. |
| BR-06 | Simulator chỉ phục vụ môi trường phi production; không nhận dữ liệu thẻ hay chuyển tiền thật. | payment-simulator provider. |
| BR-07 | Payment failure không được tạo Order thành công hoặc tăng reservation ngoài ý muốn. | Payment fail integration test. |
| BR-08 | Retry cùng giao dịch không tạo duplicate order; conflict payload xử lý theo idempotency policy được phê duyệt. | Phải bổ sung ADR/test. |
| BR-09 | Inventory reservation không vượt khả dụng trong các request đồng thời. | Cần concurrent test. |
| BR-10 | Notification chạy sau khi phát sinh Order; lỗi email không hủy Order. | Mục tiêu Tuần 8. |
| BR-11 | Customer chỉ xem order của mình; Admin/Staff thao tác theo quyền. | Medusa auth/access boundary. |
| BR-12 | Media lưu qua file/object storage hợp lệ; database lưu metadata/URL, không lưu blob nặng. | Yêu cầu kiến trúc Tuần 9. |
| BR-13 | Raw H&M history không được import thành Order; giá/stock demo ghi synthetic provenance. | scripts/hm/README.md. |
| BR-14 | Secrets/PII không ghi vào git, test artifacts hoặc public logs. | Security/ops plan. |
| BR-15 | Mọi deployment/schema change phải có migration, backup/rollback plan tương ứng. | deploy/RUNBOOK.md. |

## 5. Data Requirements & Ownership

### 5.1 Mô hình dữ liệu nghiệp vụ

| **Entity / group** | **Thuộc tính chính** | **Authoritative owner** | **Integrity / security** |
| --- | --- | --- | --- |
| Customer / Auth Identity | Email, profile, auth identity, identity boundary. | Medusa Customer/Auth | Customer PII; không trả dữ liệu người khác; không commit credentials. |
| Product / Variant | Title, handle, SKU, options, category/collection, images, metadata. | Medusa Product | SKU/ID unique; published/channel/region controls. |
| Price / Region / Sales Channel | Currency VND, regions, price sets, channel visibility. | Medusa Pricing/Region/Sales Channel | UI dùng price response; không hard-code authoritative totals. |
| Inventory Item / Level / Reservation | Stock, reservation, stock location, availability. | Medusa Inventory | Không double reserve; liên kết giữa variant và inventory item qua workflows. |
| Cart / CartLineItem | Cart ID, region, customer, line item, quantity, addresses. | Medusa Cart | Cart mutation validation, HTTP-only cart ID cookie. |
| Payment Collection / Session / Payment | Provider, status, amounts, authorize/capture/refund state. | Medusa Payment | Phân biệt authorized/captured; no real money. |
| Order / OrderItem / Fulfillment | Order ID, status, line-item snapshots, fulfillment. | Medusa Order/Fulfillment | Order chỉ từ complete cart; history có authz. |
| Notification Attempt (target) | Event ID, order ref, attempt/status, error code, timestamp. | Custom Medusa module/Notification provider (planned) | Retry dedupe, time-bounded retention, no token leakage. |
| Operational Logs & Metrics | request ID, latency, HTTP code, service, correlation. | Observability tooling (planned) | Không log payload nhạy cảm; có retention. |
| H&M Mapping (optional) | source article ID, Medusa product/variant IDs, source hash. | Offline ETL + mapping artifact | Không trộn với real orders; rights/provenance. |

### 5.2 Quan hệ, consistency và vòng đời

- Product có các Variants; variant gắn SKU, pricing/inventory qua modules/links của Medusa. Không giả định foreign key SQL xuyên mọi module.
- Cart chứa các line items, region và optional customer. Checkout cập nhật address/shipping/payment session; hoàn tất cart trả Order và lưu liên kết Order–Cart.
- PaymentCollection chứa PaymentSessions/Payments; authorized, captured và refunded là các trạng thái khác nhau, cần đối soát độc lập.
- InventoryLevel lưu stocked/reserved; checkout đúng tạo reservation tương ứng quantity. Không suy ra stocked_quantity tự giảm ngay tại thời điểm Order được tạo.
- OrderItem/OrderLineItem và snapshot tồn tại theo version. Kiểm thử cần sử dụng đúng API, module links và version khi đọc lại.
- Notification attempts (nếu bổ sung) là dữ liệu async với dedupe key, retry count và retention rõ. Không ghi token, email đầy đủ vào message logs công khai.

### 5.3 Privacy và retention

Customer email/address/phone là PII; production-like logs và test artifacts không được đưa đầy đủ dữ liệu thật vào Git. Test dùng email/domain giả, environment và credentials riêng. Retention thời gian thực cho order/customer phải tuân thủ chính sách nhóm chọn; chưa có thông tin pháp lý/doanh nghiệp cụ thể nên không tự đặt số ngày retention bắt buộc. Raw H&M data (optional) phải được giữ offline, xác nhận quyền sử dụng, hash customer IDs với khóa bí mật và không gán historical purchases thành real orders.

## 6. External Interface Requirements

| **ID** | **Kênh** | **Route / integration** | **Contract & control** |
| --- | --- | --- | --- |
| UI-01 | Browser / Next.js | /vn/store; /vn/products/[handle]; /vn/cart; /vn/checkout; /vn/account/orders | Mobile/desktop, form validation, error/empty/loading states. |
| API-01 | Storefront → Medusa Store API | /store/products; /store/regions; /store/carts; /store/carts/{id}/line-items | HTTPS + publishable key; auth bearer cho private resource. |
| API-02 | Checkout / Payment | /store/payment-collections; .../payment-sessions; /store/carts/{id}/complete | Only Medusa creates Order; idempotency target; no real card data. |
| API-03 | Customer Orders | /store/orders; /store/orders/{id} | Authorization; only owned resource. |
| API-04 | Store Auth | /auth/customer/emailpass; /store/auth/login (custom route exists) | Medusa auth; avoid inventing new password DB. |
| API-05 | Admin | /app; Medusa Admin API | Admin authz and account roles. |
| INT-01 | Backend ↔ PostgreSQL 16 | DATABASE_URL / Medusa modules | Transactions, migrations, backups, pool limits. |
| INT-02 | Backend/Worker ↔ Redis 7 | REDIS_URL; cache/event/workflow/locking | Retries, cache invalidation, fault handling. |
| INT-03 | Media ↔ S3-compatible storage | Medusa file provider if configured | Object URI/URL; rights, bucket policy, HTTPS. |
| INT-04 | Notification adapter target | Medusa event bus/worker → email sandbox provider | Delivery attempt status, backoff, idempotency. |
| OPS-01 | CI/CD ↔ cloud staging | GitHub Actions deploy.yml → VM SSH/Caddy/Compose | Release SHA, secrets, migration, readiness/rollback. |

### 6.1 HTTP error semantics và backward compatibility

Các API cần từ chối input sai theo HTTP 4xx thích hợp; lỗi phụ thuộc dùng 5xx cùng log correlation; UI không coi HTTP 2xx/non-order result là checkout thành công. Tất cả private endpoints phải kiểm tra auth ở server. Các endpoint Medusa chuẩn được ưu tiên, custom routes phải mô tả schema, authorization, error codes, pagination/limits và versioning trước khi triển khai. Những path trong bảng là API hiện sử dụng hoặc dự kiến dựa trên code baseline, không phải cam kết toàn bộ đã có custom implementation.

## 7. Non-Functional Requirements (NFR)

NFR có các target đo được và trường xác nhận. Đặc biệt 30 RPS/3 RPS/p95 là threshold trong k6 source; không có bằng chứng chúng đã đạt. Availability 99,5% là đề xuất, chưa được thông qua. RPO/RTO là mục tiêu trong runbook, chưa thử restore.

### 7.1 Performance & Capacity

#### NFR-PERF-01  [M]  Catalog read: 30 RPS/10 phút; p95 <600 ms, failure <1% (target k6).

Phương pháp xác minh: k6 load/catalog.js; lưu hardware profile, DB size và latency percentiles.

Baseline/evidence: Script có; chưa có benchmark report.  |  Milestone: Tuần 12

#### NFR-PERF-02  [M]  Checkout workload: 3 RPS/5 phút; p95 bước complete <1.500 ms, failure <1% (target).

Phương pháp xác minh: k6 load/checkout.js trên staging test DB/fixture; kiểm soát write side effects.

Baseline/evidence: Script có; chưa có benchmark report.  |  Milestone: Tuần 12

#### NFR-PERF-03  [S]  Tài liệu workload định nghĩa RPS/concurrency/read-write ratio, peak & 5× scenario nếu khả thi.

Phương pháp xác minh: Workload model + 1×/5× report hoặc lý do không khả thi.

Baseline/evidence: Planned.  |  Milestone: Tuần 12

#### NFR-PERF-04  [M]  DB pool và connection count theo dõi dưới max_connections; tránh 53300 trong workload mục tiêu.

Phương pháp xác minh: Capture pg_stat_activity, pool, peak; failure budget 0 connection-exhaustion events.

Baseline/evidence: Đã từng gặp historic 53300 local; chưa benchmark.  |  Milestone: Tuần 11–12

### 7.2 Reliability, Availability & Recovery

#### NFR-REL-01  [M]  Complete-cart retry/concurrency không tạo duplicate Order/Payment inconsistency.

Phương pháp xác minh: Two concurrent + timeout retry tests và links/inventory readback.

Baseline/evidence: Chưa đủ test.  |  Milestone: Tuần 7,12

#### NFR-REL-02  [M]  Notification/search/cache failure không rollback Order hợp lệ hoặc trả order success giả.

Phương pháp xác minh: Fault injection; order creation và recovery evidence.

Baseline/evidence: Partial infrastructure.  |  Milestone: Tuần 8,12

#### NFR-REL-03  [M]  RPO ≤60 phút và RTO ≤120 phút là target ban đầu của runbook.

Phương pháp xác minh: Chạy restore từ backup, đo độ cũ bản backup và thời gian khôi phục.

Baseline/evidence: Target có; chưa drill.  |  Milestone: Tuần 10,12

#### NFR-REL-04  [S]  Availability SLO được công bố theo demo/staging window; đề xuất khởi điểm 99,5%, cần approval.

Phương pháp xác minh: Availability numerator/denominator và loại downtime planned rõ; đo monitoring.

Baseline/evidence: Chưa chốt hay đạt.  |  Milestone: Tuần 11–12

#### NFR-REL-05  [M]  Health/readiness signal phản ánh trạng thái server và hạ tầng then chốt.

Phương pháp xác minh: Health checks postgres/redis/backend, test dependency failure.

Baseline/evidence: Health checks có; chưa đủ failure drill.  |  Milestone: Tuần 10–12

### 7.3 Security & Privacy

#### NFR-SEC-01  [M]  All customer-owned resource endpoints enforce server-side authentication/authorization.

Phương pháp xác minh: Negative cross-account tests và access matrix; không rò 200 response.

Baseline/evidence: Một phần; cần security review.  |  Milestone: Tuần 11

#### NFR-SEC-02  [M]  Transport trên cloud qua HTTPS/TLS và DB/Redis không public Internet.

Phương pháp xác minh: SSL/TLS curl/scanner + network exposure checklist.

Baseline/evidence: Config Caddy/loopback; chưa cloud evidence.  |  Milestone: Tuần 10–11

#### NFR-SEC-03  [M]  Secrets không ở Git/log/artifacts; dùng protected CI environment/VM secret storage.

Phương pháp xác minh: Secret scan và review deploy workflow/logs.

Baseline/evidence: .gitignore + GitHub Secrets design; cần review.  |  Milestone: Tuần 10–11

#### NFR-SEC-04  [M]  Không lưu raw credentials/card details; logs che customer PII/tokens.

Phương pháp xác minh: Security review, log sampling, no sensitive fields.

Baseline/evidence: Chưa chứng minh đầy đủ.  |  Milestone: Tuần 11

#### NFR-SEC-05  [M]  Simulator không chạy ở production.

Phương pháp xác minh: Production build/config check từ chối provider.

Baseline/evidence: Code guard đã có; test prod mode cần verify.  |  Milestone: Tuần 7,11

### 7.4 Observability

#### NFR-OBS-01  [M]  Request rate, error rate, p50/p95/p99, CPU/RAM/DB connections được đo.

Phương pháp xác minh: Metrics dashboard với 1h test sample và raw evidence.

Baseline/evidence: Chưa có metrics dashboard.  |  Milestone: Tuần 11–12

#### NFR-OBS-02  [S]  Correlate request/cart/order/payment/worker events bằng IDs và structured logging.

Phương pháp xác minh: Log trace của một Order xuyên boundaries không lộ PII.

Baseline/evidence: Một số structured logs; chưa end-to-end trace.  |  Milestone: Tuần 11

#### NFR-OBS-03  [M]  Alert cơ bản cho 5xx, backend down, DB pressure/backup failure.

Phương pháp xác minh: Fault test trigger + alert evidence.

Baseline/evidence: Chưa có alerts.  |  Milestone: Tuần 11–12

### 7.5 DevOps & Maintainability

#### NFR-OPS-01  [M]  Build/test/lint/typecheck nhất quán trước deploy.

Phương pháp xác minh: GitHub Action run pass trên commit/PR target.

Baseline/evidence: CI và API Actions pass.  |  Milestone: Tuần 10

#### NFR-OPS-02  [M]  Deploy traceable, migration được kiểm soát, rollback plan đã diễn tập.

Phương pháp xác minh: Run logs, release SHA, rollback/restore record.

Baseline/evidence: Workflow/runbook; chưa deploy rehearsal.  |  Milestone: Tuần 10,13

#### NFR-OPS-03  [S]  No destructive DB operations during routine deployment; data retained on container restart.

Phương pháp xác minh: Review runbook + restart/recovery test.

Baseline/evidence: Compose volume present; chưa recovery report.  |  Milestone: Tuần 10–12

### 7.6 Data Integrity

#### NFR-DATA-01  [M]  Data integrity: Medusa là authoritative source; không chèn core table trực tiếp ngoài workflows.

Phương pháp xác minh: Code review + cart/order/price/inventory reconciliation.

Baseline/evidence: Architecture boundary có; tests từng phần.  |  Milestone: Tuần 4–9

#### NFR-DATA-02  [M]  Customer private data chỉ dùng cho mục đích demo có kiểm soát; access/retention policy.

Phương pháp xác minh: Privacy checklist, fixture isolation và retention notes.

Baseline/evidence: Partial.  |  Milestone: Tuần 11

### 7.7 FinOps

#### NFR-COST-01  [M]  Budget tháng được phê duyệt trước cloud deploy; actual spend không vượt cap nếu không có CR.

Phương pháp xác minh: Budget ledger, service cost breakdown, cost/traffic note.

Baseline/evidence: Chưa có số ngân sách hay report.  |  Milestone: Tuần 10,12

### 7.8 Quality & Traceability

#### NFR-QUAL-01  [M]  Requirements↔implementation↔test↔evidence traceability trước final submission.

Phương pháp xác minh: RTM với trạng thái và link artifact; unresolved gaps được ký nhận.

Baseline/evidence: SRS mới, RTM chưa baseline.  |  Milestone: Tuần 13

## 8. Business scenarios & acceptance test design

| **Use Case** | **Tên** | **Flow / success path** | **Linked requirements** |
| --- | --- | --- | --- |
| UC-01 | Customer registration / login | Khách chưa login, email hợp lệ → tạo identity/profile → login → giữ session; sai mật khẩu không truy cập. | FR-AUTH-01..03 |
| UC-02 | Search and select product | Khách search → catalog list → PDP → variant/price region → add to cart. | FR-CAT-01..05, FR-CART-01 |
| UC-03 | Complete purchase | Cart có item → address/shipping → payment session → complete → Order ID + confirmation. | FR-CHK-01..03, FR-PAY-01, FR-INV-01 |
| UC-04 | Payment declined | Cart hợp lệ → simulator failure → no Order, inventory unchanged, lỗi được hiển thị. | FR-PAY-02, FR-PAY-04, FR-CHK-04 |
| UC-05 | Duplicate/retry checkout | Hai request đồng thời + retry timeouts → một Order hợp lệ tối đa. | FR-PAY-03, NFR-REL-01 |
| UC-06 | Order notification | Order created → event → async worker → email sandbox, retry nếu lỗi. | FR-NOT-01..03 |
| UC-07 | Admin inventory / fulfillment | Operator xem order, inventory và thao tác theo quyền. | FR-ADM-01, FR-ORD-03 |
| UC-08 | Cloud deploy and recovery | Release qua CI/CD → staging health test → restore/rollback drill. | FR-OPS-01..04, NFR-REL-03 |

### 8.1 Kịch bản acceptance trọng yếu (Given–When–Then)

#### AT-01 Purchase success

Given một variant published, có VND price, sales channel và stock; When Customer hoàn tất shipping/payment hợp lệ; Then API trả Order ID, link và order detail khớp cart; inventory reservation được đối soát.

#### AT-02 Payment decline

Given một cart hợp lệ và simulator đặt simulated_outcome=false ở test; When complete cart; Then trả lỗi thích hợp, không có Order mới gắn cart và inventory snapshot không thay đổi.

#### AT-03 Idempotency

Given một cart đủ điều kiện; When hai completion requests đồng thời và một retry sau timeout; Then tối đa một Order hợp lệ, không reserve thừa; nếu conflict payload phải có hành vi xác định và log evidence.

#### AT-04 Customer isolation

Given Customers A và B có orders khác nhau; When A gọi detail/history của B; Then không trả dữ liệu của B; tương tự thao tác admin không authenticated bị chặn.

#### AT-05 Async provider down

Given một Order đã tạo; When email adapter lỗi nhiều lần rồi phục hồi; Then Order vẫn tồn tại, attempts có retry có giới hạn và notification cuối không bị gửi trùng ngoài policy.

#### AT-06 Redis failure

Given storefront đang browse/checkout; When Redis không khả dụng trong test fault scenario; Then hệ thống phản hồi theo fallback/failure policy đã công bố và không trả order success giả.

#### AT-07 Performance

Given staging với dataset/CPU/RAM/currency đã log; When chạy catalog 30RPS/10m và checkout 3RPS/5m; Then p95 và error rate nằm trong ngưỡng đã phê duyệt; lưu raw report.

#### AT-08 Restore

Given staging backup có timestamp; When giả lập mất DB và restore vào staging; Then dữ liệu được đối soát, RPO/RTO đo và so với mục tiêu 60/120 phút.

## 9. Requirement Traceability & verification status

Để hỗ trợ review nhanh, bảng dưới ánh xạ nhóm requirement vào tuần, baseline code/test và phần chưa đáp ứng. Một bảng traceability cấp requirement riêng cần được cập nhật sau mỗi PR và gắn test link chính xác; bảng này là phần tóm tắt có thể dùng ngay.

| **Req group** | **Week** | **Evidence hiện có** | **Gap / exit criteria** |
| --- | --- | --- | --- |
| FR-AUTH / FR-CAT | 5 | Auth/product/catalog/store UI, HTTP tests | Access negative tests, filter/search evidence. |
| FR-CART / FR-CHK | 6 | Store SDK flow, checkout integration, order detail | Browser E2E lên main, cloud E2E. |
| FR-PAY / FR-INV | 7 | Simulator success/failure; inventory T0/T1/T2 24/24 | Duplicate/retry/concurrency/compensation. |
| FR-ORD / FR-NOT | 8 | Order history/detail, Redis/worker configured | Notification async, retry, order state tracking. |
| FR-INT | 9 | Redis caching module, search v1, S3 optional config | Cache test, object storage running, search ADR. |
| FR-OPS / NFR-OPS | 10 | GitHub CI pass, deploy workflow/runbook | Cloud URL, release/migration and rollback rehearsal. |
| NFR-SEC / NFR-OBS | 11 | Auth/server boundary and Docker logs | Access matrix, audit, dashboard & alert. |
| NFR-PERF / NFR-REL / NFR-COST | 12 | k6 scripts and RPO/RTO targets | Benchmark, fault/recovery test, budget report. |
| NFR-QUAL / FR-REC | 13 | Docs, H&M ETL pilot per README | RTM acceptance; recommendation optional. |

## 10. Dependencies, assumptions, unresolved issues

| **ID** | **Cần quyết định / blocker** | **Impact nếu chưa chốt** |
| --- | --- | --- |
| OPEN-01 | Chọn cloud provider, VM sizing, managed DB vs VM Postgres, budget cap. | Không chốt final deployment/performance NFR. |
| OPEN-02 | Thông báo email sandbox provider, retry policy, dedupe/retention. | FR-NOT chưa thể accepted. |
| OPEN-03 | Chính sách image rights/object storage/URL. | Media requirement chưa hoàn thành. |
| OPEN-04 | Idempotency strategy tận dụng Medusa hoặc extension phù hợp, timeout/timeout retry behavior. | Payment consistency chưa được nghiệm thu. |
| OPEN-05 | Availability SLO/time window và RPO/RTO approval; phương pháp đo. | Không có SLA/NFR sign-off. |
| OPEN-06 | Quyền dữ liệu H&M; quy mô, quality và public demo. | Recommendation optional blocked. |
| OPEN-07 | Đồng bộ browser E2E từ recommendation sang branch dựa trên main. | Thiếu CI browser acceptance trên main. |

## 11. Review, approval và change management

Requirement owner đề xuất: Team Lead phụ trách business scope; Backend owner phụ trách checkout/consistency; Frontend owner phụ trách UX; DevOps owner phụ trách cloud/NFR; QA owner giữ evidence và RTM; giảng viên/phản biện quyết định chuẩn deliverable theo học phần. Bản thảo chỉ trở thành baseline approved sau review có biên bản.

Thay đổi requirement cần ghi CR-ID, ID thay đổi, lý do, tác động lên use case/architecture/data/test/cost, priority, target milestone và review decision. Với yêu cầu không thể hoàn tất, đánh dấu Deferred/Exception cùng risk acceptance và giải pháp thay thế, không xóa khỏi tài liệu hay tự đánh “Passed”.

## Nguồn và căn cứ kiểm chứng

**[SRC-01]** Cloud Application Development – Course Project Topics, Project 1; tệp PDF do nhóm cung cấp. *— Tính năng bắt buộc, workload, cloud ops, architecture và NFR.*

**[SRC-02]** Kế hoạch triển khai Enterprise E-commerce Platform, Tuần 4–13; Pasted markdown do nhóm cung cấp. *— Mốc công việc và deliverables.*

**[SRC-03]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/main (baseline d0bf45a). *— Source thực tế đã đối chiếu 02/11/2026.*

**[SRC-04]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/recommendation (baseline a98457c). *— ETL, H&M importer và browser E2E chưa đồng bộ toàn bộ sang main.*

**[SRC-05]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/report/inventory-consistency-notes.md *— Evidence checkout/inventory một lần chạy, 24/24 checks.*

**[SRC-06]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/integration-tests/http/checkout-order.spec.ts *— HTTP integration tests, payment simulator success/failure.*

**[SRC-07]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/RUNBOOK.md *— Kiến trúc single-VM và RPO/RTO mục tiêu, chưa có recovery drill.*

**[SRC-08]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753319 *— CI success tại main, 01/11/2026.*

**[SRC-09]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753297 *— API tests success tại main, 01/11/2026.*

**[SRC-10]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/scripts/hm/README.md *— Bằng chứng được ghi trong repo về pilot H&M 500 products, 1.874 variants.*

Chú giải độ tin cậy: “đã có code” chỉ thể hiện trong repository; “đã kiểm thử” yêu cầu test/evidence; “đã nghiệm thu” yêu cầu đạt acceptance criteria trên môi trường và dữ liệu được ghi rõ. Các thông tin ở tài liệu nguồn cũ có thể lỗi thời so với commit baseline.
