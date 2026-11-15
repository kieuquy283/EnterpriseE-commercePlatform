# Cổng nghiệm thu và thứ tự triển khai

[Đặc tả nghiệp vụ](../README.md#primary-business-first-specification) quy định phạm vi, tác nhân, quy tắc và mục tiêu chất lượng. Tài liệu này ánh xạ sang công việc triển khai và bằng chứng; không biến mã nguồn hay kết quả build thành chứng nhận luồng nghiệp vụ hoàn chỉnh. Mỗi thay đổi cần truy tới [yêu cầu](01-business.md), [luồng](02-flows.md) và [kiểm chứng](05-testing.md). Chủ sở hữu và ngày giao việc thuộc issue tracker của nhóm.

## Các cổng giao bài

| Cổng | Sản phẩm cần có | Điều kiện thoát |
| --- | --- | --- |
| P1 | Bài toán, tác nhân, FR/NFR, tải và kiến trúc | Phân biệt mục tiêu được chọn với kết quả đo |
| P2 | Thành phần, API, dữ liệu, tích hợp | Một hành trình customer/staff hoàn chỉnh, hợp đồng và tình huống lỗi |
| P3 | Bảo mật, CI/CD, container/IaC, rollback | Phát hành được cho phép và diễn tập rollback/bảo mật thực tế |
| P4 | Tải, lỗi, quan sát, năng lực và chi phí | Kết quả baseline/peak, xử lý trùng, phục hồi và ngân sách |
| P5 | Gợi ý sản phẩm, quyền dữ liệu, đánh giá | Chất lượng/độ trễ có đo, không ảnh hưởng giao dịch |

Kiểm soát bảo mật và kiểm thử đi cùng từng lát cắt; không đợi tới P3 mới thực hiện.

## Nền tảng Week6

Quyết định trong phạm vi đã được giao: giữ Medusa modular monolith, Admin mặc định và Next.js; dùng CLI onboarding có sẵn; giữ tương thích các endpoint kế thừa trong khi siết đầu vào/đầu ra. Không thêm framework wrapper, migration, dịch vụ cloud hoặc cơ chế tạo staff tự động. Nghiệp vụ và NFR được dùng làm đầu vào đã thống nhất cho công việc này; việc kiểm chứng các mục tiêu vẫn độc lập.

| Yêu cầu / luồng | Triển khai và hợp đồng | Bằng chứng / phần còn lại |
| --- | --- | --- |
| FR-09 / FLOW-09, RULE-11 | Build Admin trong `.medusa/server/public/admin`; startup tại thư mục gói; onboarding bằng CLI invite riêng tư theo [setup](../setup.md) | Kiểm tra gói/API và nhận lời mời bên dưới; chưa có walkthrough staff trên trình duyệt |
| FR-01 / FLOW-01 | Schema runtime credentials, lỗi đăng nhập không lộ thông báo provider; actor `user` và `customer` tách biệt | HTTP kiểm tra dữ liệu sai, mật khẩu sai, nhận invite, login staff và từ chối token staff tại customer API |
| FR-03 / FLOW-03 | Legacy `/store/cart` chỉ nhận region/channel/email, lấy `customer_id` truyền vào workflow từ auth context, kiểm tra channel của publishable key; DTO chỉ có id/region/currency và id/variant/quantity của items | HTTP kiểm tra guest, identity/price/channel tampering, số lượng nguyên dương và không xóa item của cart khác qua native/legacy |
| FR-04/05/06 / FLOW-04/05 | Fixture checkout có kết quả đơn/payment/stock xác định; không seed order production | HTTP thành công/thất bại; ma trận retry/concurrency đầy đủ thuộc Week7 |
| FR-02 / FLOW-02 | Importer riêng có 30 sản phẩm/230 SKU; bảo toàn stock cũ; [catalog](../catalog/DATASET.md) | Không còn dùng mô tả ba sản phẩm bootstrap làm trạng thái catalog; ảnh đại diện không chứng minh ảnh từng SKU |
| FR-02 / FLOW-02 | Latest phân trang tại Medusa; sort giá đọc tất cả trang khớp trước khi sắp xếp, không cắt 100 sản phẩm | Mã tại `apps/storefront/src/lib/data/products.ts`; chưa chứng minh tải lớn/giới hạn bộ nhớ hay đồng bộ cache nhiều replica |
| P3 / phụ thuộc | Next.js và body-parser được vá tương thích; audit không bị tắt hoặc bỏ qua | Các advisory còn lại vẫn chặn việc tuyên bố production-ready; xem bảng phân loại |

### Ranh giới cart/auth kế thừa

Kiểm kê source bằng `rg` cho thấy storefront dùng SDK native `/store/carts` và `/auth/customer/emailpass`; chỉ integration tests đang gọi `/store/auth/login` và `/store/auth/register`; không thấy consumer source của singular `/store/cart`. Đây không phải bằng chứng rằng không có consumer ngoài repository, nên giữ route và status thành công cũ; DTO cart được thu hẹp có chủ đích để không trả customer/email/metadata/địa chỉ nội bộ. Consumer cần tổng tiền/checkout dùng hợp đồng native đã hỗ trợ.

Router Medusa 2.21.2 áp publishable key và optional customer auth cho `/store`; validator của `/store/carts` không tự áp vào `/store/cart`. Trước thay đổi, legacy create chuyển nguyên `req.body` vào workflow, nên client có thể chỉ định `customer_id`; GET trả model không projection. Item POST không kiểm tra số nguyên. Workflow Medusa `deleteLineItemsWorkflow` xóa theo IDs, không tự kiểm tra item thuộc `cart_id`; workflow ứng dụng mới kiểm tra quan hệ trước khi gọi workflow core; middleware native DELETE dùng lại bước kiểm tra này.

Cart-ID vẫn là capability truy cập của guest theo Store API Medusa; có token customer không làm cart-ID trở thành tài nguyên chỉ chủ account được truy cập. Không thêm yêu cầu đăng nhập đại trà hoặc tuyên bố lỗ hổng A/B chỉ từ việc biết cart ID. ID cart phải được giữ trong cookie HTTP-only của storefront. Kiểm tra item thuộc cart là ràng buộc đối tượng riêng, không thay thế chính sách capability của native API. Medusa core có thể tìm/tạo customer theo email liên hệ của guest; việc đó không xác thực account hay cấp token customer. Không diễn giải liên kết email thành bằng chứng đăng nhập. Không sửa hợp đồng framework `/store/carts` trong phạm vi này. Native DELETE cũng dùng core workflow đó; middleware ứng dụng bổ sung cùng workflow kiểm tra trước controller native. Đây là extension có lý do cụ thể: tránh bỏ qua ràng buộc bằng endpoint khác, giữ nguyên DTO/status và quyền guest của framework. HTTP kiểm tra từ chối cross-cart và chấp nhận xóa đúng cart trên cả hai đường. Không thay controller native hoặc sửa package đã cài.

### Fixture nghiệm thu giao dịch

Dùng fixture hiện có trong `integration-tests/http/checkout-order.spec.ts` và bootstrap trên DB disposable. SKU `TEE-ESSENTIAL-BLK`, giá 249000 VND, quantity 1, shipping 30000 VND, không promotion: payment collection kỳ vọng 279000 VND. Mỗi ca có snapshot stock riêng, không dựa vào stock của lần chạy trước.

| Tình huống | Order/payment kỳ vọng | Stock kỳ vọng |
| --- | --- | --- |
| Simulator thành công | Một order với một item, collection `authorized`, amount 279000 VND; chưa đồng nghĩa thu tiền/COD | `stocked_quantity` giữ nguyên, `reserved_quantity` tăng 1 trước fulfillment |
| Hủy order chưa fulfillment | Workflow hủy được gọi, không chỉnh DB trực tiếp | Snapshot trở về trước checkout |
| Simulator thất bại | Complete trả 400, không có liên kết order-cart | Snapshot không đổi |

Không tạo order giả trong seed production. Fulfillment/tracking, COD collection và trả hàng là bước vận hành tiếp theo; reservation không đồng nghĩa xuất kho hay giao hàng.

### Bằng chứng kỹ thuật ngày 15-11-2026

Nền source `14d0028`, branch `feat/daymark-storefront-catalog`; PR 14 vẫn draft/open. Kết quả dưới đây dành cho working tree chưa commit, không phải CI của head cũ. Không push/merge/deploy. Các container cũ giữ nguyên trạng thái dừng.

- Backend lint và typecheck qua; unit 13 suites/121 tests qua.
- HTTP mục tiêu `auth-catalog-search.spec.ts` và `checkout-order.spec.ts`: 2 suites/24 tests qua trên PostgreSQL 17 tạm, cổng loopback riêng; runner dùng Redis giả lập. Có log lỗi payment mô phỏng và cảnh báo đóng connection từ runner; verdict dựa trên assertions đã qua, không diễn giải log đó là lỗi production.
- `npm run build --workspace=@dtc/backend` qua cả backend và Admin. Kiểm tra runtime bằng `npm run start --workspace=@dtc/backend`, DB/Redis tạm riêng: migration qua, `/health` 200, `/app` 200, JS asset Admin 200, Admin API không token 401; CLI có working directory `.medusa/server`; `medusa user --invite` tạo lời mời thành công, token không công khai. Worker với Redis thật trả health 200, `/app` và Admin API 404, xác nhận không phục vụ routes API/Admin. Symlink preview cũ ở thư mục source không được dùng và không bị sửa/xóa.
- Các lần thử ban đầu bị chặn bởi SSL của test runner khi dùng `127.0.0.1`, và CLI invite chạy lặp lại trên email fixture đã dùng; lần chạy cuối dùng `localhost`/email fixture mới đã qua. Đây là lỗi thiết lập kiểm tra đã xử lý, không giấu thành lượt PASS ban đầu. Hai container PostgreSQL/Redis do lượt kiểm tra tạo đã được dừng/xóa, không dùng volume cũ.
- Storefront lint và typecheck qua sau bản vá Next.js; Oxfmt các tệp code/package thay đổi và `git diff --check` qua; `npm run docs:check` qua (chỉ link tệp, không kiểm tra fragment); chưa chạy storefront build/browser E2E cho phiên bản mới. Chưa chứng minh walkthrough fulfillment, phân quyền staff chi tiết, tải hoặc recovery cloud.

### Phân loại dependency advisory

Lệnh `corepack npm audit --omit=dev --json` trên Node 24.22.1/npm 11.12.1: trước thay đổi 25 high/1 critical; sau bản vá 23 high/0 critical; tổng sau là 92 (65 moderate, 4 low). Đây là số package/advisory lan truyền, không phải số đường khai thác độc lập. Package được khai báo trong production có thể chứa công cụ build; `--omit=dev` không chứng minh mọi nhánh đều chạy khi nhận HTTP.

Đã dùng npm/root lockfile nâng Next.js 15.5.24 → 15.5.29 và `eslint-config-next` tương ứng, cùng body-parser 1.20.8 → 1.20.9 trong range Express, follow-redirects 1.16.1 → 1.16.3 và fast-uri → 3.1.9 trong range hiện tại. Hai bản vá sau không đổi giao diện dependency khai báo; HTTP regression được chạy lại vì axios/test client và URI tooling có dùng chúng. Advisory follow-redirects là GHSA-mrwp-f3q8-3g9p; fast-uri gồm GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h, GHSA-wjr9-j795-jxcr, GHSA-333x-w4r6-6crp. Các advisory Next gồm GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p; body-parser là GHSA-27r3-jxmh-p828. Bản vá giảm nguy cơ tại HTTP/Image Optimization/Server Actions; chưa coi lint/typecheck là bằng chứng browser regression đầy đủ.

Các advisory trực tiếp còn lại của audit, kể cả leaf nằm trong dependency gián tiếp:

| Leaf / đường dependency | Advisory còn tồn tại | Khả năng chạm và hướng xử lý |
| --- | --- | --- |
| `@medusajs/framework → @medusajs/deps → zod` (backend cũng ghim trực tiếp) | GHSA-mrhx-c7xc-m3w5 | Validation runtime; cần dữ liệu collection ràng buộc quá lớn. Schema mới chỉ scalar, nhưng chưa loại trừ routes native khác. Framework ghim 4.2.0; cần nâng Medusa đồng bộ/kiểm thử, không override mù |
| `@medusajs/medusa → multer` | GHSA-q7qp-rjg7-q26m | Upload middleware runtime, cần nhánh fileFilter/request teardown; chưa dựng exploit. Có bản 2.5.0 trong cùng major nhưng thay đổi minor cần kiểm thử upload riêng |
| `next → postcss` | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | CSS/source-map build, Next ghim bản nested; chưa thấy app nhận CSS do khách gửi. Nâng trực tiếp PostCSS không sửa nested pin; cần bản Next tương thích hoặc override được kiểm chứng riêng |
| `@medusajs/* → @graphql-codegen/* → @graphql-tools/utils` | GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3 | Sinh kiểu/merge GraphQL; chưa thấy public GraphQL handler của app nhận đầu vào merge. Cần nâng chuỗi codegen/framework, không suy ra miễn nhiễm chỉ từ không có route |
| `@graphql-codegen/plugin-helpers → lodash` | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh | Template/import keys hoặc path do đối thủ điều khiển; app chưa cho khách gửi template. Bản nested bị ghim; xem xét cập nhật codegen đồng bộ |
| `@medusajs/deps → @opentelemetry/instrumentation-pg` | GHSA-qqmp-wf37-98f9 | Có thể đưa username DB vào telemetry khi tracing bật; không xuất telemetry nhạy cảm và kiểm tra processor/exporter trước bật tracing; nâng instrumentation cùng framework |
| `@medusajs/notification-sendgrid → @sendgrid/* → deepmerge` | GHSA-gcqx-w48m-w2h4 | Provider chưa cấu hình trong app; không bật trước kiểm tra cấu hình merge và bản vá |
| `@medusajs/cli/admin-bundler/framework → glob → minimatch` | GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249 | Discovery/build theo filesystem/glob; chưa thấy public handler nhận pattern. Không nhận glob của khách; bản vá cần kiểm tra compatibility/major của minimatch |
| `@rushstack/node-core-library → ajv` | GHSA-2g4f-4pwh-qvx6 | Schema tooling, cần tùy chọn `$data`. Nhánh này ghim `~8.13.0`; không nhận schema tùy ý, cần nâng Rushstack/tooling và kiểm chứng riêng |
| `tailwindcss → postcss-selector-parser` | GHSA-rj75-hqrm-r3gf | Build selector, chưa có CSS khách gửi; nâng parser tương thích và build để kiểm chứng |
| `qs` (storefront trực tiếp; Express/SDK gián tiếp) | GHSA-6pq8-jhm2-2vcw | `stringify` với `arrayFormat: comma` và own `toString` không callable; chưa xác lập đường runtime dùng đúng tùy chọn. Cần rà adapter và vá cùng dòng |
| `@medusajs/event-bus-redis/workflow-engine-redis → bullmq → uuid` | GHSA-w5hq-g745-h8pq | Cần v3/v5/v6 với buffer tùy biến; chưa xác lập BullMQ gọi nhánh này. Không ép major uuid; nâng BullMQ/framework và kiểm tra workflow/event retry |

Nguồn ID/range/fix path là JSON audit hiện tại và dependency manifest đã cài; tra nội dung từng ID tại `https://github.com/advisories/<ID>`. Reachability trong bảng là phân tích source có giới hạn, không phải exploit test hay miễn trừ bảo mật. npm đề xuất Medusa 2.22.7 cho nhiều chuỗi bị ghim; đó là nâng framework đồng bộ cần công việc riêng, không phải các bản vá transitive vô hại. Không chạy `audit fix --force`, không đổi major framework, không tắt gate. Cổng audit production vẫn **chưa đạt** vì 23 high còn tồn tại; không khuyến nghị merge với tuyên bố production-ready.

## Công việc tiếp theo

- **Week7 — giao dịch:** ma trận completion trùng/concurrent, timeout sau commit, last-unit contention, giá/khuyến mại thay đổi, order/payment/inventory reconciliation đầy đủ. Dùng DB/stock test riêng.
- **Week8 — vận hành staff và thông báo:** walkthrough nhận stock → publish → mua → fulfillment → tracking thủ công → customer status → COD reconciliation; xác định evidence fields/quyền hiệu lực trước extension. Provider thông báo qua ADR về compatibility/Region/chi phí, retry/idempotency và lỗi có thể quan sát; chưa chọn provider hay tạo SES.
- **Gợi ý sản phẩm:** giữ độc lập và có feature gate; quyền dữ liệu, baseline, đánh giá chất lượng, consent và degraded mode riêng. Không đưa nghiên cứu H&M vào public mặc định.
- **Week9 — cloud:** release tự động được cho phép, rollback, k6 baseline/ramp/5x/10x khám phá, task scaling, backup/restore, ngân sách. Chỉ thực hiện khi có cho phép cloud/spend; cấu hình hoặc script tồn tại không phải kết quả đo.
- **Nợ kỹ thuật:** advisory còn lại; cache eviction/freshness nhiều replica; connection-pool budget; orchestration recommendation dưới HTTP; route adapter version-coupled. Không dùng nợ hiện hữu làm lý do viết lại toàn bộ ứng dụng.

Hoàn thành một công việc khi yêu cầu, luồng, triển khai và bằng chứng khớp nhau. Chưa chạy phải ghi rõ; phần chưa xong cần TODO có kiểu/issue và hành động cụ thể. Không tự commit/push/merge/deploy hoặc xóa dữ liệu ngoài phạm vi đã được giao.
