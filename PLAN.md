# Kế hoạch rebuild nền tảng E-commerce bằng Medusa v2

Trạng thái: **đang triển khai trên nhánh `Medusa`**. Phạm vi là một MVP có luồng mua hàng hoàn chỉnh, vận hành được trên cloud và đo được chất lượng. Medusa v2 là nguồn dữ liệu và logic chuẩn cho commerce; không fork hoặc sửa Medusa core. Xem README để biết cách chạy và các cổng kiểm chứng còn thiếu.

## 1. Audit repository hiện tại

Đã kiểm tra trên nhánh `Medusa`. Repository là npm workspaces với `apps/api` (Fastify 5 + Prisma), `apps/storefront` (Next.js 15 + Tailwind), PostgreSQL/Redis/Meilisearch trong `docker-compose.yml`, seed Prisma và một script E2E. Không có `AGENTS.md`, GitHub Actions, cấu hình deploy, object storage, load test hoặc telemetry trong source đang theo dõi. Working tree sạch tại thời điểm audit.

| Thành phần hiện tại | Nhận xét và quyết định |
| --- | --- |
| `apps/api/src/main.ts` | **Thay thế** bằng app Medusa v2. File này tự định nghĩa auth, catalog, cart, checkout, payment, inventory, order và event; giữ lại làm tài liệu đối chiếu luồng, không chạy song song với Medusa. |
| `apps/api/prisma/schema.prisma`, migrations, seed | **Ngừng dùng** sau khi xuất dữ liệu cần giữ. Các bảng Prisma không được tiếp tục làm nguồn dữ liệu commerce. Viết seed Medusa mới bằng workflow/API chính thức. |
| `apps/storefront/app/**`, `components/**`, CSS | **Giữ và refactor chọn lọc** phần giao diện, nội dung và Tailwind. Mọi trang đang phụ thuộc DTO/API tự viết cần chuyển sang Medusa JS SDK và các trường dữ liệu Medusa. |
| `apps/storefront/lib/api-client.ts`, `types.ts`, `auth-context.tsx` | **Viết lại**: API trả `{data, request_id}`, JWT và role tự tạo không tương thích Medusa; client hiện lưu bearer token trong `localStorage`. Thiết kế lại theo Medusa SDK, session/cookie và kiểm tra quyền phía server. |
| `app/admin/**` | **Không giữ làm hệ thống quản trị chính**. Sử dụng Medusa Admin cho sản phẩm, inventory, order, fulfillment; chỉ thêm widget/page cần thiết cho báo cáo và vận hành. Trang admin tự viết có thể bỏ sau khi đạt tương đương chức năng. |
| `scripts/test-e2e-flow.ts` | **Viết lại** theo API/SDK Medusa, bao gồm thanh toán thành công/thất bại, retry, tồn kho và notification. Script cũ phụ thuộc endpoint Fastify và tài khoản seed cố định. |
| `docker-compose.yml` | **Refactor**: đang có PostgreSQL, Redis, Meilisearch nhưng app chỉ dùng PostgreSQL; thêm backend/worker/storefront, MinIO cho local và healthcheck/volume phù hợp. |
| `README.md`, `.env.example`, npm scripts | **Cập nhật** sau khi chuyển đổi. README hiện mô tả API cũ và tuyên bố một số chức năng chưa thật sự triển khai. |

### Khoảng trống và rủi ro đã thấy

- Checkout hiện gộp payment và order trong một request, payment luôn `AUTHORIZED`; chưa có trạng thái `captured`, `failed`, `cancelled` hay bước xác nhận riêng.
- Key idempotency unique theo provider nhưng chưa ràng buộc với customer, cart và payload; retry cùng key cho cart khác có thể trả về order không đúng chủ sở hữu.
- Tồn kho được tăng `quantityReserved` khi đặt hàng nhưng không có quy trình giải phóng hoặc khấu trừ khi hủy/fulfill. Kiểm tra stock lúc thêm cart không đủ chống race ở checkout.
- Outbox hiện chỉ đánh dấu `PROCESSED` và ghi log; chưa gửi notification. `setInterval` chạy trong API process, không có worker độc lập, retry có backoff hay dead-letter.
- Meilisearch/Redis có container nhưng chưa được tích hợp. Search hiện là `contains` trong PostgreSQL, không có đồng bộ index/rebuild.
- `/health` luôn trả `ok` dù PostgreSQL/Redis lỗi. Chưa có metric, tracing, alert, backup/restore hoặc k6.
- CORS `origin: true`, fallback JWT/cookie secret, tài khoản admin/customer với mật khẩu cố định trong seed; quyền admin chủ yếu do UI kiểm tra. Trang chi tiết admin gọi `api.getOrder()` thuộc customer route, nên có nguy cơ không xem được order khách khác.
- Checkout UI hiển thị địa chỉ giao hàng mặc định nhưng không thu thập địa chỉ/shipping method thật. README có chi tiết cũ và lỗi encoding cần chỉnh.

## 2. Quyết định kiến trúc và phạm vi

**Kiểu hệ thống:** modular monolith Medusa v2, Next.js storefront riêng, một process Medusa server và một process Medusa worker dùng chung codebase/DB. Chỉ một vùng bán hàng, một kho, một currency chính (`VND` nếu cấu hình phiên bản và region xác nhận hỗ trợ chính xác), một phương thức giao hàng giả lập, một payment simulator. Không tạo microservices, message broker thứ hai, hệ thống BI hay đa vùng trong MVP.

```text
Browser ──HTTPS──> Next.js storefront ──Medusa JS SDK──> Medusa API/Admin
                                                   │
                              PostgreSQL <─────────┤ commerce + custom metadata
                              Redis <──────────────┤ event bus, jobs, cache
                              S3/MinIO <───────────┤ product media
                              Meilisearch <────────┘ product search index
                                                   │
                              Medusa worker <───────┘ subscribers + retry
                                                   │
                              Notification adapter (sandbox email; log sink local)
```

| Nhu cầu | Medusa v2 có sẵn | Phần cần xây/tích hợp |
| --- | --- | --- |
| Auth/customer | Customer/Auth APIs, token/session, Admin user | Gắn UI login/register và route bảo vệ; định nghĩa quyền staff/admin server-side. Không tự tạo bảng password. |
| Catalog/giá | Product, Variant, Category, Pricing, Region | Seed/mapping dữ liệu cũ; storefront; cấu hình region và giá. |
| Search | Product listing/filter cơ bản | Meilisearch indexing theo event, full reindex job, fallback có giới hạn sang Medusa listing khi search lỗi. |
| Cart/checkout/order | Cart, shipping, Payment Collection/Session, `completeCartWorkflow`, Order | UI từng bước, payment simulator, idempotency ở điểm xác nhận, test các nhánh lỗi. Không tự tạo order bằng SQL. |
| Inventory | Inventory module và reservation khi order được tạo | Cấu hình stock location/sales channel, test oversell, giải phóng reservation khi cancel/fulfill. Tránh tự trừ stock hai lần. |
| Tracking/fulfillment | Order/Fulfillment APIs và Medusa Admin | Timeline hiển thị từ trạng thái Medusa; nếu cần milestone tùy biến thì module nhỏ hoặc metadata + workflow, không tự ghi trạng thái order trái quy tắc Medusa. |
| Notification | `order.placed` và các event/subscriber, Notification module | Subscriber gửi email sandbox bất đồng bộ, template, retry, dedupe, audit kết quả. |
| Administration/reporting | Medusa Admin quản lý commerce | Dashboard gọn: orders/ngày, doanh thu đã capture, payment failure, low stock; query read-only có phân quyền admin. |
| Media | File module | S3-compatible provider; MinIO local, bucket private và URL truy cập phù hợp. |

Tài liệu Medusa cần khóa phiên bản và đối chiếu khi bắt đầu coding: [tạo app](https://docs.medusajs.com/resources/create-medusa-app), [payment provider](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider), [checkout payment](https://docs.medusajs.com/resources/storefront-development/checkout/payment), [complete cart](https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart), [Redis event module](https://docs.medusajs.com/resources/infrastructure-modules/event/redis), [events/subscribers](https://docs.medusajs.com/learn/fundamentals/events-and-subscribers). Đặc biệt, Medusa đã tự tạo reservation khi mua hàng; payment và cart completion có cơ chế bù trừ, vì vậy chỉ mở rộng qua provider/workflow hook được hỗ trợ.

### Luồng nghiệp vụ ưu tiên

1. Customer đăng ký/đăng nhập, browse hoặc search sản phẩm, mở detail và chọn variant.
2. Tạo cart, thêm item; Medusa tính giá theo region, khuyến mãi nếu dùng, phí ship và tổng tiền.
3. Nhập email/địa chỉ, chọn shipping method, khởi tạo Payment Collection/Session với simulator. Simulator tạo attempt `pending`; người dùng chọn kết quả mô phỏng `success` hoặc `failure` qua endpoint có xác thực và ràng buộc cart.
4. Khi `success`, provider trả `authorized`; storefront gọi complete cart. Medusa tạo order và reservation theo workflow chuẩn. Capture được thực hiện theo chính sách đã chọn và được kiểm chứng độc lập với authorization. Khi `failure/cancel`, không tạo order và không giữ stock. Không hiển thị thành công chỉ vì API trả HTTP 2xx: phải kiểm tra response là `type: order`.
5. Medusa phát `order.placed`; Redis event bus chuyển subscriber cho worker. Worker gửi notification, ghi kết quả và retry có backoff. Lỗi notification không rollback order.
6. Customer xem order history/tracking; staff thao tác fulfillment; admin xem KPI và operational status.

**Idempotency:** dùng khóa do client tạo cho mỗi hành động xác nhận, gắn với `customer_id + cart_id + amount/currency + payload hash`, lưu bằng custom module/record có unique constraint. Retry cùng khóa/cùng payload trả cùng kết quả; cùng khóa/khác payload trả `409`. Đối chiếu cả idempotency của Medusa API/workflow theo phiên bản đã khóa, không xây lại transaction/order engine. Kiểm thử hai request đồng thời, timeout sau authorize và retry sau khi order đã tạo.

**Payment simulator:** tạo Medusa Payment Module Provider (`src/modules/payment-simulator/`) bằng interface chính thức. Mô hình trạng thái nghiệp vụ `pending → authorized → captured`, nhánh `failed`/`cancelled`, chỉ chấp nhận transition hợp lệ. Endpoint mô phỏng phải chỉ tác động payment attempt của cart hiện tại, không nhận amount từ client, không xử lý tiền thật, có audit và idempotency. Test `initiate`, `authorize`, `capture`, `cancel`, lỗi và retry. Quyết định capture lúc đặt order hoặc lúc staff duyệt cần thống nhất ở phase 0; mặc định MVP: capture sau order thành công, kiểm chứng bù trừ khi cart completion lỗi.

## 3. Cấu trúc dự kiến

```text
apps/
  backend/                  # Medusa v2 application; thay apps/api
    medusa-config.ts
    src/modules/payment-simulator/
    src/modules/checkout-attempt/  # chỉ nếu Medusa idempotency chưa đủ
    src/api/store/payment-simulator/
    src/api/admin/reports/
    src/subscribers/order-placed.ts
    src/subscribers/product-index.ts
    src/jobs/reindex-products.ts
    src/workflows/             # chỉ các extension cần orchestration riêng
    src/scripts/seed.ts
  storefront/               # Next.js, UI giữ/refactor
    lib/medusa-sdk.ts
    app/...                  # catalog, cart, checkout, account, orders
infra/
  docker/                   # Dockerfiles và cấu hình runtime
  cloud/                    # IaC tối thiểu cho 1 môi trường staging/prod
tests/
  api/
  integration/
  e2e/
  load/checkout.js          # k6
.github/workflows/
docs/                       # ADR, runbook, API/flow, kết quả NFR
docker-compose.yml
```

Không chuyển bảng Prisma cũ vào schema Medusa. Nếu cần dữ liệu ngoài commerce (attempt/audit/report snapshot), tạo custom module nhỏ và module link theo hướng dẫn Medusa, với migration thuộc Medusa.

## 4. Migration dữ liệu và API

1. Chụp schema + số lượng row + backup PostgreSQL cũ; đóng băng write trong cửa sổ cutover. Không chạy Prisma migration vào Medusa DB.
2. Mapping Product/Variant/SKU/category/price/stock sang Medusa product, region, sales channel, stock location và inventory item. SKU là khóa đối chiếu, lưu mapping ID cũ → mới; kiểm tra currency/rounding và tổng tồn kho.
3. Customer: chỉ migrate profile/email nếu thật sự cần. Không copy password hash Argon2 vào Auth module khi chưa chứng minh tương thích; phương án mặc định là reset password/đăng ký lại cho demo. Admin cũ tạo lại bằng quy trình Medusa Admin, bỏ mật khẩu seed công khai.
4. Order lịch sử: MVP có thể lưu DB cũ read-only như archive xuất CSV và chỉ migrate catalog + customer; nếu bài tập yêu cầu lịch sử hợp nhất, làm spike import order bằng API/workflow được hỗ trợ, giữ external legacy ID và đối soát payment/inventory. Không ghi thẳng bảng Medusa.
5. Đặt contract mới cho storefront bằng SDK/API Medusa. Xóa route `/store/auth/*`, checkout gộp và `/admin/orders/:id/status` cũ sau khi UI + E2E chuyển xong. Cập nhật README, env, test. Cutover bằng staging smoke test → backup → đổi routing; rollback dùng image/DB backup đã kiểm thử.

## 5. Milestone triển khai và điều kiện hoàn thành

| Phase | Phụ thuộc | Việc làm và deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| **0. Baseline & quyết định** | Không | Chốt version Medusa/Node, region/currency, chính sách capture/shipping, cloud target, ADR, backup dữ liệu cũ; chụp contract/test hiện tại. | ADR được ghi; mapping dữ liệu và test plan được review; baseline build/storefront và DB inventory được ghi lại. |
| **1. Medusa foundation** | 0 | Tạo `apps/backend` từ starter chính thức; PostgreSQL, Redis, MinIO, Meilisearch local; seed region, sales channel, stock location, shipping option, 3 sản phẩm. | `docker compose up` chạy được; migrate/seed lặp lại an toàn; `/health/live` và `/health/ready` phản ánh dependency; Medusa Admin vào được bằng user tạo an toàn. |
| **2. Storefront & identity/catalog** | 1 | SDK, auth customer, product list/detail, search + indexer/reindex, media; refactor UI sẵn có. | Customer login/register/logout; list/detail đúng giá VND và variant; search trả sản phẩm seed, reindex tái tạo index; lỗi search có thông báo/fallback. |
| **3. Cart & checkout vertical slice** | 1, 2 | Cart, address, shipping, Payment Collection/Session, simulator, authorize/capture/fail/cancel, complete cart, idempotency, inventory reservation. | E2E thành công từ browse đến order; hai retry cùng key cho đúng một order/payment; key khác payload bị từ chối; 2 checkout cạnh tranh không oversell; payment fail/cancel không tạo order; kiểm tra amount và stock trước/sau. |
| **4. Tracking, notification, staff** | 3 | Order history/detail có auth, fulfillment/status, Redis subscriber + email sandbox, retry/dedupe, Medusa Admin staff workflow. | Customer chỉ thấy order của mình; staff fulfill/cancel theo quyền; tracking cập nhật; notification gửi trong 60 giây hoặc có retry/failed record; lỗi email không mất order. |
| **5. Reporting & vận hành** | 3, 4 | Admin KPI read-only, structured logs, metrics/traces, dashboard/alerts, security hardening, backup/restore runbook. | Report đối soát với orders/payments; customer/staff bị chặn khỏi admin report; trace theo request/order ID; alert thử nghiệm; restore staging đáp ứng RTO/RPO. |
| **6. Cloud & CI/CD** | 1–5 | Docker images, IaC hoặc manifest triển khai 1 region, GitHub Actions, secret store, migrations trước release, staging smoke test, rollback. | Push/PR chạy lint/typecheck/test/build/scan; deploy staging tự động, production qua approval; TLS, backup và health probes hoạt động; rollback được diễn tập. |
| **7. NFR & release gate** | 3–6 | k6, failure injection, tuning và báo cáo kết quả thực đo. | Đạt bảng NFR dưới đây hoặc ghi rõ sai lệch và biện pháp; chạy lại vertical slice trên cloud; không còn lỗi severity cao trong payment/auth/inventory. |

Ưu tiên để đạt MVP đúng hạn: Phase 0–4 bắt buộc cho demo; Phase 5–7 bắt buộc trước khi gọi là production-oriented MVP. Nếu thiếu thời gian, bỏ promotion nâng cao, nhiều kho, nhiều shipping provider và dashboard phức tạp, không bỏ kiểm thử checkout/stock/security.

## 6. NFR mục tiêu và cách đo

Các số dưới đây là **mục tiêu đề xuất**, chưa phải kết quả đo. Tải giả định: catalog 30 requests/giây peak trong 10 phút; checkout 3 completions/giây trong 5 phút; dữ liệu 1.000 products, 10.000 orders, 100 khách đồng thời; một cloud region. Dùng k6 trên staging cấu hình tương đương production, warm-up 5 phút, đo 3 lần và lưu p50/p95/p99 cùng lỗi.

| Chỉ tiêu | Mục tiêu MVP | Cách xác nhận |
| --- | --- | --- |
| Catalog/product p95 | ≤ 400 ms API, search p95 ≤ 600 ms | k6 read mix 70% list/search, 30% detail; từ edge/API, không tính render browser. |
| Cart mutation p95 | ≤ 700 ms | k6 create/add/update cart, stock khả dụng. |
| Checkout complete p95 | ≤ 1.5 s với simulator; lỗi 5xx < 1% | k6 3 completions/s, đo cả authorization và completion; không tính notification bất đồng bộ. |
| Availability | ≥ 99,5%/tháng cho storefront + checkout | Synthetic probe mỗi phút, trừ maintenance đã công bố; mục tiêu vận hành, chưa cam kết HA đa vùng. |
| Recovery | RTO ≤ 2 giờ, RPO ≤ 1 giờ | Backup PostgreSQL có PITR/WAL hoặc snapshot theo giờ; diễn tập restore và ghi timestamp. |
| Notification | ≥ 99% gửi/ghi nhận trong 60 giây | Metric `order.placed` → delivered, retry/backoff và failed queue quan sát được. |
| Bảo mật | 0 critical/high từ dependency scan trước release; 100% admin API có authz | CI scan + test 401/403, rate limit auth/payment simulator, secret scan. |
| Cloud budget | Trần **USD 200/tháng** cho staging/prod demo một vùng; dự toán USD 130–200 | Backend + worker + Next.js 60–90; managed PostgreSQL/backups 35–55; Redis 10–20; Meilisearch 10–20; object storage/egress/monitoring 15–25. Kiểm giá nhà cung cấp trước deploy; load-test bursts và email volume tính riêng. |

Nếu budget không đủ cho managed services, dùng một VM chạy Docker Compose và backup offsite như phương án demo; ghi rõ điểm lỗi đơn và hạ mục tiêu availability tương ứng. Không tuyên bố 99,9% khi chưa có multi-AZ/HA.

## 7. Failure scenarios, security và observability

| Sự cố | Hành vi cần có | Test |
| --- | --- | --- |
| Hai checkout cùng variant tồn kho cuối | Chỉ một order thành công; order còn lại nhận lỗi stock có thể xử lý; không âm tồn kho. | Integration concurrency và k6 race. |
| Payment thất bại/hủy hoặc timeout giữa authorize và complete | Không tạo duplicate order/charge; retry dùng cùng attempt/key; compensation của workflow được kiểm chứng. | Fault injection provider + E2E retry. |
| Redis/worker ngừng | Order đã commit không mất; notification tồn trong queue/retry sau phục hồi; readiness cho worker báo lỗi. | Tắt worker/Redis và khởi động lại; đối soát event. |
| Meilisearch ngừng/index trễ | Checkout vẫn dùng Medusa DB; search trả lỗi có kiểm soát/fallback; reindex và độ trễ index có metric. | Tắt search, sửa product, bật lại và reindex. |
| S3/MinIO lỗi | Product API/checkout tiếp tục; ảnh dùng placeholder, upload admin lỗi rõ. | Chặn object storage khi duyệt/mua hàng. |
| PostgreSQL mất kết nối | Readiness fail, không nhận checkout mới; khi phục hồi không tạo trùng từ retry. | Tạm dừng DB, kiểm tra HTTP/alert/recovery. |
| Deploy/migration lỗi | Không rollout version mới; rollback image, restore DB chỉ khi migration không backward-compatible và đã có backup. | Diễn tập staging. |

**Security:** HTTPS, cookie `HttpOnly/Secure/SameSite` khi phù hợp, CORS allowlist, CSP, CSRF phù hợp kiểu auth, input validation, rate limits, least privilege cho DB/Redis/S3, secrets từ secret manager, tách demo credentials khỏi production, audit thao tác staff/admin. Customer order endpoint phải kiểm tra ownership phía server. Payment simulator chỉ bật trên môi trường demo và không lưu dữ liệu thẻ. Staff có quyền vận hành giới hạn; admin mới xem reporting và cấu hình; kiểm tra RBAC qua API chứ không dựa vào ẩn nút UI.

**Observability:** JSON logs có `request_id`, `cart_id`, `order_id`, `payment_attempt_id` nhưng không log password/token/PII; `/health/live` cho process, `/health/ready` cho DB và dependency thiết yếu; metrics request rate/error/p95, checkout success/failure, reservation conflict, event lag/retries, search lag, DB pool; trace OpenTelemetry tương thích qua HTTP → workflow → DB/worker khi thư viện hỗ trợ. Dashboard và alert tối thiểu cho 5xx, checkout failure, queue backlog, DB/Redis down, backup failure. Mỗi cảnh báo có runbook ngắn.

**CI/CD:** PR chạy format/lint/typecheck, unit test provider/state transitions, integration test Medusa + PostgreSQL/Redis, API/E2E vertical slice, build images, dependency/secret scan. Merge `main` deploy staging, chạy smoke; production deploy bằng approval với image digest cố định. Migrations chạy có backup, health gate và rollback. k6 chạy theo lịch hoặc trước release, tránh load test trên production demo.

## 8. Checklist cho coding agent

- [ ] Đọc plan, xác nhận version Medusa/Node và các ADR phase 0; ghi baseline, backup DB cũ.
- [ ] Tạo Medusa app từ starter chính thức ở `apps/backend`; khóa dependency; không chỉnh `node_modules` hoặc Medusa core.
- [ ] Cấu hình PostgreSQL, Redis event/cache, MinIO/S3, Search Module tích hợp và Docker Compose; thêm health checks.
- [ ] Seed region, sales channel, stock location, shipping, product/variant/price/stock bằng API/workflow Medusa; đối soát SKU.
- [ ] Tạo SDK client; chuyển customer auth và catalog UI; bỏ JWT/API DTO tự viết.
- [ ] Tích hợp search indexer, reindex và fallback; kiểm tra update/delete product; chỉ thêm Meilisearch nếu có provider phù hợp và NFR đòi hỏi.
- [ ] Chuyển cart, address và shipping UI sang Medusa SDK; kiểm tra total server-side.
- [ ] Xây payment simulator provider và endpoint điều khiển an toàn; test trạng thái, amount, authz, capture/cancel/failure.
- [ ] Thêm idempotency ràng buộc customer/cart/payload; test retry tuần tự, đồng thời và timeout.
- [ ] Hoàn tất cart bằng workflow Medusa; kiểm chứng order, payment và reservation/compensation, không trừ stock thủ công.
- [ ] Chuyển order history/tracking; dùng Medusa Admin cho staff, thêm RBAC và admin report tối thiểu.
- [ ] Thêm `order.placed` subscriber, notification adapter sandbox, retry/dedupe và event metrics.
- [ ] Viết unit, integration, API và E2E cho vertical slice cùng các failure scenario trong mục 7.
- [ ] Thêm structured logs, metrics, tracing, dashboard, alert, backup/restore và security controls.
- [ ] Thêm Docker images, cloud deployment, GitHub Actions, staging smoke/rollback; cập nhật README/env/runbook.
- [ ] Chạy k6 theo tải mục tiêu; lưu kết quả và chi phí thực tế; chỉ release khi đạt acceptance criteria.

## 9. Tiến độ thực tế (14/10/2026)

| Hạng mục | Trạng thái và bằng chứng |
| --- | --- |
| Phase 0–2 | Đã thay Fastify/Prisma bằng Medusa v2.21.2 và Next.js starter SDK; seed VND/Vietnam, sản phẩm, giá, tồn kho, shipping; PostgreSQL, Redis, MinIO, built-in Search Module trong cấu hình. Chưa chạy seed với DB thật tại workspace này. |
| Phase 3 | Đã viết payment simulator và UI success/failed/cancelled; middleware idempotency dùng Medusa cache + lock để gắn key với cart/customer/payload trong 24 giờ; Medusa `completeCartWorkflow` giữ vai trò tạo order/reserve inventory. Unit test 6 ca đạt. Chưa có E2E, concurrency và timeout test với DB. |
| Phase 4–5 | Starter có order history/tracking và Medusa Admin. Đã thêm `order.placed` subscriber, local/SendGrid adapter, report 100 order gần nhất, health endpoints, `/metrics` Prometheus và Zipkin tracing. Chưa đo retry/event lag, chưa kiểm chứng RBAC staff so với admin bằng API, chưa có dashboard/alert hoàn chỉnh. |
| Phase 6–7 | Đã có Dockerfiles, Compose local, cấu hình cloud một VM + Caddy, CI typecheck/unit/build, workflow deploy thủ công có environment approval và readiness gate, k6 catalog/checkout. Chưa chạy workflow deploy trên cloud, backup/restore rehearsal, load result và dependency audit sạch. |

**ADR thay đổi:** Medusa v2.21 có Search Module PostgreSQL tích hợp; hướng dẫn Meilisearch cũ đã deprecated. MVP dùng Search Module mặc định để giảm dịch vụ cần vận hành; chỉ thêm Meilisearch provider khi đo NFR search cho thấy cần thiết. Storefront cũ phụ thuộc API Fastify riêng nên thay bằng Next.js starter chính thức và chỉ chuyển dữ liệu/ý tưởng UI khi phù hợp. Bản cũ lưu tạm trong `.legacy/` (gitignored) để đối chiếu, không chạy song song.

**Release gate còn mở:** Docker daemon ở máy này không khởi động được kể cả khi thử bật service, nên chưa thể xác nhận migration/seed/runtime/E2E. Storefront production build trên Windows đã qua compile/typecheck nhưng lỗi lúc prerender `/404`/`/500` (`React useContext`); cần sửa hoặc xác minh bản build Linux trong CI trước deploy. `npm audit --omit=dev` hiện báo 30 high và 68 moderate, phần lớn qua dependency Medusa; cần triage từng finding và cập nhật phiên bản an toàn được Medusa hỗ trợ. Không coi dự án đã sẵn sàng release cho tới khi các acceptance criteria Phase 3–7 được đo trên staging và các lỗ hổng dependency mức high được xử lý hoặc chấp nhận có căn cứ.

## 10. Build update (14/10/2026)

The previous release-gate note about the Windows storefront prerender error is superseded: both the Medusa backend/Admin and the Next.js storefront production builds now pass locally. The npm workspace resolves React 19 for Next.js and React 18 inside the backend; the backend build sets NODE_PATH to its workspace node_modules so the Admin bundler can resolve @medusajs/ui. Unit tests (6/6) and backend typecheck pass. The legacy Fastify/Prisma app and the ignored .legacy archive have been removed from the workspace; the previous source remains in Git history. Runtime migration/seed, database-backed checkout E2E/concurrency, Docker, cloud deployment, load targets, and vulnerability triage remain release gates because the Docker daemon is unavailable on this host.

## 11. Current MVP scope (15/10/2026; supersedes earlier implementation claims)

The requested MVP now uses Medusa's supported features without custom extensions. Sections 1–10 document the original migration plan and previous prototype; claims there about the simulator, custom idempotency, notifications, reporting, metrics, and Zipkin no longer describe the active application.

| Capability | Current implementation |
| --- | --- |
| Customer auth, catalog, product details, cart, checkout, order history | Official Next.js starter using Medusa Store APIs and JS SDK. |
| Search | Basic Medusa Store Products `q` query with server pagination. No external engine/indexer. |
| Payment | Medusa built-in manual/system provider `pp_system_default`, presented as cash on delivery. No real charge, success/failure simulator, or custom payment state machine. |
| Inventory, pricing, fulfillment, orders | Medusa commerce modules and standard cart completion, plus seed data and manual shipping option. No custom order/inventory logic. |
| Administration | Standard Medusa Admin. No custom reports or staff RBAC extension. |
| Infrastructure | PostgreSQL, Redis modules, optional S3-compatible file provider, API/worker/Next.js containers. `/health` is Medusa's process probe. |

**Deferred until separately requested:** simulated payment outcomes and custom idempotency middleware; email/other customer notification subscribers; reporting dashboard/API; Meilisearch and indexing; custom metrics, readiness, tracing, alerts; staff-specific permissions; cloud NFR validation. These should not be implied as implemented in demos. The default Medusa payment provider is a manual recording mechanism, not an online processor.

**Verification gate:** lint, typecheck, production builds, and Compose syntax are local checks. Before claiming the MVP runs stably, start PostgreSQL/Redis, run migration and seed on a clean DB, complete one customer COD order, check stock/order status in Admin, then repeat after process restart. Test a failed checkout due to insufficient stock and ensure there is no completed order. Docker daemon access is currently unavailable on this host, so runtime acceptance remains open.

### Implementation checklist for the reduced scope

- [x] Remove custom Medusa extensions, simulator UI, external search adapter, and stale dependencies.
- [x] Use Store API keyword search and Medusa manual payment checkout.
- [x] Update Compose, deployment runbook, CI, and README for the reduced scope.
- [ ] Run migration and seed against a live clean PostgreSQL database.
- [ ] Verify registration, search, cart, COD checkout, order history, and inventory reservation end to end.
- [ ] Verify restart/retry and insufficient-stock behavior with PostgreSQL/Redis.
- [ ] Rehearse backup/restore and run k6 on a staging deployment before stating NFR attainment.
