# BÁO CÁO ĐÁNH GIÁ HIỆN TRẠNG DỰ ÁN DAYMARK

**Tổng thể và chi tiết theo Frontend · Backend · Ops & CI/CD · Data · QA, Testing & Documentation**  
**Ngày đánh giá:** 16/11/2026 · **Phiên bản báo cáo:** Audit v1.0 · **Mục đích:** Làm baseline giao việc và cổng nghiệm thu cho giai đoạn 16/11–06/12/2026.  
**Repository:** [kieuquy283/EnterpriseE-commercePlatform](https://github.com/kieuquy283/EnterpriseE-commercePlatform) · **Baseline xem xét:** `main` tại `084f2297ac00f90cab59692865439a6ba5139855` (merge PR #15 ngày 15/11/2026).  
**Đối tượng nhận báo cáo:** Tech Lead, các thành viên phát triển, QA và người review đồ án.

> **Phạm vi & giới hạn:** Đây là đánh giá *source-based*: đối chiếu các tệp tài liệu đã cung cấp trong Project, nội dung của các tệp mã nguồn/tài liệu GitHub được truy cập trực tiếp, lịch sử commit/PR và các báo cáo kiểm thử–AWS có ngày. Chưa checkout và chạy toàn bộ monorepo, chưa chạy lại CI/Playwright/k6, chưa đăng nhập AWS hay truy cập trực tiếp PostgreSQL, Redis, S3 hoặc CloudWatch ở thời điểm 16/11. Vì vậy không suy diễn tình trạng runtime hiện nay từ kết quả lịch sử. Các chat ngoài phần đang truy cập trong Project không được kiểm chứng độc lập. Một số nguồn được lấy mẫu theo rủi ro; đây không phải code review từng dòng trên toàn repository.

## TÓM TẮT ĐIỀU HÀNH

**Kết luận chính.** DAYMARK đã vượt giai đoạn proof-of-concept: monorepo Medusa/Next.js có giao diện thương hiệu mới, dữ liệu catalogue mẫu, quy trình checkout/COD, các API recommendation, bộ test và hạ tầng AWS từng được triển khai. Tuy nhiên **chưa đủ bằng chứng để đánh dấu hoàn thành mọi yêu cầu hoặc production-ready**. Rủi ro cao nằm tại xử lý lặp checkout và cạnh tranh tồn kho, thông báo giao dịch, workflow Staff/Fulfillment, khả năng chạy E2E trên bản UI vừa merge, cổng bảo mật dependency và kiểm chứng phát hành AWS mới.

**Đánh giá tổng thể đề xuất:** **Đang tích hợp / chưa nghiệm thu toàn hệ thống**. Nhãn này là nhận định quản trị dựa trên bằng chứng, *không phải* tỷ lệ phần trăm hoàn thành được đo. Kết quả dự án tại một mốc Git khác hoặc một thời điểm AWS khác phải được kiểm lại trước khi đổi nhãn.

| Nhóm | Tình hình hiện tại | Rào cản nghiệm thu quan trọng | Chủ trách nhiệm theo phân công mới |
|---|---|---|---|
| Frontend | UI DAYMARK đã merge PR #14, các route và component chính hiện hữu; có Playwright specs | Chưa chứng minh full browser regression của commit mới; UX lỗi/empty/mobile/a11y cần nghiệm thu lại | **Quý** — toàn bộ frontend |
| Backend | Medusa 2.21.2, checkout/COD/simulator và kiểm soát boundary có code, unit/HTTP từng chạy | Chưa đủ test duplicate/retry/last-unit contention; notification, staff lifecycle chưa đủ bằng chứng | **Hoàng** — nghiệp vụ/API/Medusa |
| Ops + CI/CD | CI, CloudFormation, ECR OIDC, runbook và một lần AWS Fargate deploy có bằng chứng | Chưa có CI Playwright gate; audit high chỉ cảnh báo; release cuối chưa được chứng minh trên AWS; rollback/restore chưa drill | **Thắng** — CI/CD/cloud |
| Data | Có schema/migrations Medusa, DAYMARK fixture 30 sản phẩm/230 SKU và importer có guard | Dữ liệu thực trên AWS chưa kiểm cho bản mới; data integrity concurrency, reporting dataset và restore đối soát còn thiếu | **Trung** — DB/Data Engineering |
| QA + Testing + Docs | Có unit/HTTP/Playwright/k6, SRS/RTM/architecture mới và báo cáo lịch sử | Chưa có test matrix và evidence hợp nhất cho SHA mới, cloud E2E/NFR/role/notification chưa đủ | **Quân** — QA, testing, docs |

### Mười vấn đề cần xử lý trước khi gọi là hoàn thiện

| ID | Mức | Vấn đề | Lý do quan trọng |
|---|---|---|---|
| R-01 | **P0** | Duplicate/retry/timeout khi complete cart | Có nguy cơ nhiều hiệu ứng Order/Payment cho một ý định mua; phải chứng minh bằng test concurrent và DB readback. |
| R-02 | **P0** | Tranh chấp tồn cuối và reservation/cancel/fulfill | Không được bán vượt tồn; một success test đơn lẻ chưa chứng minh concurrency. |
| R-03 | **P0** | Chưa hoàn thành notification giao dịch | Redis worker có sẵn không đồng nghĩa đã có email subscriber/provider, bounded retries và dedupe. |
| R-04 | **P0** | Staff/Admin full order lifecycle và phân quyền | Chưa có bằng chứng walkthrough nhận tồn→publish→fulfillment→tracking→COD và role negative tests đầy đủ. |
| R-05 | **P0** | Chưa chạy full browser E2E của DAYMARK vừa merge | PR #14 đổi nhiều UI/routes; kết quả Playwright ngày 09/11 không đại diện bản ngày 15/11. |
| R-06 | **P0** | Cổng dependency security chưa đạt | Audit 15/11 báo 23 high, 0 critical; CI `npm audit` đang `continue-on-error: true`. Cần triage rủi ro và quyết định release gate. |
| R-07 | **P0** | AWS deployment trên release candidate mới chưa được chứng minh | Kết quả AWS 09/11 là bản `389e855`, khác baseline ngày 15/11; thời gian lease lịch sử đã kết thúc. |
| R-08 | **P1** | CI/CD chưa gắn browser test và cloud smoke bắt buộc | Pipeline có lint/unit/API/build nhưng chưa xác nhận Playwright, business readback, rollback evidence vào gate. |
| R-09 | **P1** | Restore drill, alert reception, peak/load còn thiếu | CloudFormation, dashboard và script là cấu hình; chưa phải kết quả RPO/RTO, p95 hay cảnh báo thực. |
| R-10 | **P1** | Chính sách nghiệp vụ/RTM còn OPEN và tài liệu bị trôi theo commit | Guest order, trạng thái, COD, báo cáo, quyền staff, dữ liệu media cần quyết định; một số ghi chú 15/11 còn gọi PR #14 draft dù PR đã merge. |

## 1. CĂN CỨ, MỨC ĐỘ TIN CẬY VÀ KIẾN TRÚC HIỆN TẠI

### 1.1. Các nhãn sử dụng

- **CODE:** Có file/component/configuration ở baseline; không đồng nghĩa vận hành đúng.
- **VERIFIED-L:** Có báo cáo kiểm thử trên môi trường local/test, ghi thời điểm và commit/ngữ cảnh; cần chạy lại trên release mới.
- **VERIFIED-C (historical):** Có bằng chứng triển khai AWS lịch sử, không khẳng định cloud đang chạy hoặc bản mới đã deploy.
- **PARTIAL:** Mới đáp ứng một phần tiêu chí hoặc thiếu evidence end-to-end.
- **GAP:** Nguồn trực tiếp ghi chưa xây hoặc chưa có bằng chứng cần thiết.
- **NOT VERIFIED:** Chưa kiểm tra được ở baseline/run hiện tại; không suy đoán PASS/FAIL.
- **TARGET:** Mục tiêu yêu cầu, chưa phải số đo đạt được.

### 1.2. Lịch sử baseline quan trọng

| Thời điểm | Thay đổi/bằng chứng | Điều không thể suy ra |
|---|---|---|
| 09/11/2026 | AWS Fargate chạy `main` `389e855`, 18/18 public checks; 65 backend unit + 12 HTTP integration trong lần deploy lịch sử [S09]. | Không chứng minh UI DAYMARK và release 15/11 đã chạy trên AWS. |
| 15/11/2026 | Bản sửa backend auth/cart; báo cáo local ghi 121 unit và 24 HTTP tests trong môi trường tạm [S03][S05]. | Không chứng minh Playwright browser của giao diện mới hoặc CI mới nhất đã pass. |
| 15/11/2026 | PR #14 merge vào main: DAYMARK storefront, design system, catalog demo [S11]. | Không bảo đảm toàn bộ màn hình, hình ảnh, hành trình và responsive đã được test trên commit merge. |
| 15/11/2026 | PR #15 merge thay đổi docs về notification/status và Medusa skills [S12]. | Không tạo ra email subscriber hoàn chỉnh chỉ nhờ tài liệu mới. |
| 16/11/2026 | Audit đọc source tại `084f229` và đối chiếu docs. | Chưa có môi trường mới chạy/CI test trực tiếp trong lần audit này. |

### 1.3. Kiến trúc triển khai

- **Frontend:** Next.js **15.5.29**, React **19.0.5**, giao diện DAYMARK trên Storefront, kết nối Medusa SDK/Store API thông qua `src/lib/data` [S01][S13].
- **Commerce backend:** Medusa **2.21.2** dạng modular monolith. Medusa core sở hữu Auth/Customer, Product/Pricing, Cart/Checkout, Payment, Order, Inventory/Fulfillment; module tùy chỉnh cho recommendation, personalization và payment simulator không dùng production [S04][S14].
- **Data:** PostgreSQL là nguồn giao dịch có thẩm quyền; Redis phục vụ cache/event/workflow/worker; media qua Medusa file module và S3 khi cấu hình; browser không ghi thẳng DB [S05][S06].
- **Cloud đích:** AWS `ap-southeast-2`, ALB/ACM → ECS Fargate (Storefront, API/Admin, worker) → RDS PostgreSQL 16, Redis trên EC2, private S3 với backend image proxy; CloudFormation quản lý `foundation/data/app` stacks [S07][S08]. EC2 Compose là fallback, không phải kiến trúc chính.
- **Dev toolchain:** Node 24.22.1/npm 11.12.1, workspaces, Turbo, Jest, Playwright, k6, GitHub Actions; môi trường local/test và AWS có ranh giới riêng [S01][S10].

### 1.4. Đối chiếu 9 nghiệp vụ bắt buộc của môn học

Nguồn bài giảng *Cloud Application Development – Project Topics* (Project 1, trang 4–5) yêu cầu đăng ký/đăng nhập, catalog/search, cart, checkout/order, payment, inventory, order tracking, notification và admin/reporting; cùng cache, object storage, async, idempotency, CI/CD, monitoring, capacity và cost [S00].

| Nghiệp vụ | Hiện trạng code/evidence | Mức kết luận | Việc còn để nghiệm thu |
|---|---|---|---|
| 01. Registration/Login | Storefront data layer và Medusa auth, backend HTTP cases gồm wrong password, missing fields, guest boundary [S16]. | CODE + VERIFIED-L một phần | Browser signup/login/logout, expired token, customer A/B, staff vs customer. |
| 02. Catalog/Search | DAYMARK 30/230 fixture; `/vn/store`, PDP, categories, collections, query `q` và sort/pagination [S13][S17]. | CODE + VERIFIED-L một phần | Dữ liệu thực được seed, 120+ item sort, unpublished/out-of-stock, cache freshness, media. |
| 03. Cart | Medusa cart qua Next data layer, add/update/remove và bảo vệ legacy/native item boundary [S14][S16]. | CODE + VERIFIED-L một phần | Reload/cookie, multi-cart, stock invalid, qty edge, price/totals. |
| 04. Checkout/Order | Address, shipping, complete cart và confirmation/history đã có; kịch bản local thành công [S14][S16]. | CODE + VERIFIED-L một phần | Browser full path của bản mới, simultaneous requests và timeout/readback. |
| 05. Payment | COD/default provider + simulator success/failure ngoài production; HTTP test nhánh lỗi [S14][S16]. | CODE + VERIFIED-L một phần | Authorize vs capture, idempotency, retry/out-of-order, production-flag check. |
| 06. Inventory | Medusa reservation/cancel có fixture; một số readback, không đủ concurrency [S03]. | PARTIAL | 20 concurrent attempts/5 units, cancel/fulfill reconciliation; không oversell. |
| 07. Order Tracking | Order history/detail UI có; trạng thái/fulfillment do Staff cần làm rõ [S04]. | PARTIAL | State mapping, customer visibility, staff manual tracking/cancel/fulfill walkthrough. |
| 08. Notification | Redis event/worker đã cấu hình; `src/subscribers/README.md` ghi customer notification vẫn là target work [S15]. | GAP | Subscriber, provider, persisted outcome, dedupe, bounded retry, email sandbox E2E. |
| 09. Admin/Reporting | Medusa Admin được build và test route/status; chưa có workflow staff & báo cáo đủ bằng chứng [S03][S04]. | PARTIAL | RBAC, inventory actions, fulfillment/tracking, COD reconciliation và báo cáo theo kỳ. |

## 2. FRONTEND — QUÝ (Frontend Lead / Architecture)

### 2.1. Mức trưởng thành chung

**Đánh giá:** CODE tương đối đầy đủ về bề mặt UI nhưng **chưa nghiệm thu release hiện tại qua browser**. PR #14 có hàng trăm file thay đổi, bao gồm route Next.js, dữ liệu, brand assets, reusable components và E2E specs; mức thay đổi lớn cần regression toàn diện. Storefront package đang dùng Next 15.5.29/React 19.0.5 [S01][S11][S13].

### 2.2. Kiểm kê chi tiết màn hình và hành vi

| Phần nhỏ | Bằng chứng đã có | Vấn đề/rủi ro còn lại | Kiểm tra chấp nhận |
|---|---|---|---|
| Home `/vn` | Hero editorial, collection art, featured/fallback products, DAYMARK design tokens; asset nội bộ [S02][S11]. | Visual/hydration regression sau PR #14; ảnh thật/hiển thị khi JS disabled. | Desktop/mobile screenshots, CTA hợp lệ, media 200, no runtime/hydration error, reduced motion. |
| Navigation/Header/Footer | Nav/menu và brand SVG; các liên kết trang sản phẩm/giỏ/tài khoản [S02][S11]. | Keyboard focus/Escape, menu mobile, href hoặc active state lỗi. | Tab/Escape, focus restore, tất cả link 200/đúng route. |
| Store/Catalog `/vn/store` | Template dùng `listProductsWithSort`, query, pagination, controls [S13]. | Sort toàn tập >100, query dài/invalid, latency và cache stale. | 120+ kết quả, sort đúng toàn danh mục, empty/filter/pagination. |
| Categories/Collections | File route `[...category]`, `[handle]`, data-layer riêng [S11]. | Danh mục rỗng, ảnh bìa/label, trang disabled, route 404. | Đúng mapping 3 collections/6 categories, không bán unpublished. |
| Product Detail (PDP) | `ImageGallery`, `ProductActions`, variants, price, rail recommendation [S11][S13]. | Giá/stock theo variant, ảnh minh họa không trùng màu SKU, rapid add-to-cart. | Test variant/price/out-of-stock, hình ảnh, số lượng/click lặp. |
| Search/Filter/Sort | Medusa `q`, sort products và bộ refinement [S13]. | Không phải full-text search engine; chưa chứng minh hiệu năng trên dữ liệu lớn. | Từ khóa hit/no-hit, query injection/length, filter combinations. |
| Login/Register/Logout | `src/lib/data/customer.ts` có signup/login/signout/profile [S13]. | Session expired, xử lý lỗi provider, guest/customer và verification UX. | Auth positive/negative, cookie secure, logout back-button, error messages. |
| Account/Profile/Addresses | Route dashboard, addresses, profile, order overview [S11]. | Không nên lộ dữ liệu A/B, stale cache, thao tác thay đổi profile và địa chỉ. | Customer A/B, invalid token, forms, error/empty/loading. |
| Cart | `src/lib/data/cart.ts` hỗ trợ create/retrieve/add/update/delete, cookie cart ID [S13]. | Race khi add/change, item của cart khác, totals/stale UI. | Add/update/delete/reload, integer qty, invalid SKU, server totals. |
| Checkout | Address, shipping, payment, review, order confirmation [S11][S13]. | Double-submit/timeout, payment fail giữ cart, không fake success; COD copy. | E2E COD success/fail, missing address/shipping, retry. |
| Order history/detail/tracking | Order confirmed/detail/history routes và components [S11]. | Các trạng thái fulfillment/tracking/thu COD chưa đầy đủ; privacy. | Order thuộc customer, order 404, state wording, timeline vs DB. |
| Recommendation UI | `getRecommendations` bị chi phối `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS`, fetch no-store, fallback [S18]. | Cần test feature ON/OFF/503, version candidates; kiểm định legal/consent riêng. | Recommendation lỗi không làm hỏng PDP/cart/checkout. |
| Responsive & accessibility | Có `design-system.spec.ts`, `responsive-mobile.spec.ts`, guideline 48px/focus [S02][S17]. | Browser test merged main chưa chứng minh; keyboard/Safari/Firefox và contrast chưa đánh giá đầy đủ. | Chromium desktop/mobile + keyboard/semantic scan; ghi giới hạn trình duyệt. |
| Caching & SEO | `force-cache` một số product/cart/customer reads; metadata/OG assets có trong repo [S11][S13]. | Cache customer/cart phải theo đúng context; ảnh/URL stale; performance LCP chưa đo. | Review cache key/context/TTL, SEO/canonical, real user page metrics. |

### 2.3. Đánh giá thiết kế và integration

**Điểm mạnh:** Design system được mô tả thống nhất: palette ngà–than–ô liu, Inter, các lớp `.dm-btn-*`, `.dm-field`, `.dm-alert-*`, grid 2 cột mobile/4 cột desktop, reduced motion, trạng thái empty/error/loading [S02]. Layer `src/lib/data` giữ ranh giới giá/checkout thuộc Medusa thay vì tự tính tại frontend [S13].

**Điểm cần xác minh:** Dự án có mã và specs test nhưng chưa có ảnh/báo cáo đối chiếu đầy đủ trên *merged commit*. Không xem việc component hiện diện là bằng chứng không lỗi. Các thành phần gắn với số tiền, phiên đăng nhập, consent không được cache công khai giữa khách. Không hiển thị trạng thái giao/COD do frontend tự suy đoán.

**Ưu tiên Quý:** (F-P0-01) smoke toàn bộ route DAYMARK; (F-P0-02) checkout/account/order end-to-end và state wording; (F-P0-03) sửa bug responsive/validation; (F-P1-04) search/sort 120+ items và cache; (F-P1-05) accessibility/SEO/visual screenshot; (F-P2-06) recommendation polish chỉ khi core pass.

## 3. BACKEND — HOÀNG (Medusa / Business Logic)

### 3.1. Kiến trúc và phạm vi sở hữu

Backend là **Medusa v2.21.2**, không phải Express API/Prisma riêng. Các routes đặt ở `apps/backend/src/api/`, mô-đun tùy chỉnh tại `src/modules/`, workflow và subscribers là extension points. Giá, order, payment, inventory vẫn do Medusa core/workflows sở hữu; không viết bảng/order engine song song [S04][S14]. Medusa Admin mặc định thuộc phạm vi vận hành backend; không xây lại UI Admin trừ gap được chứng minh.

### 3.2. Kiểm kê dịch vụ, endpoint và nghiệp vụ

| Phần nhỏ | Tình trạng có căn cứ | Thiếu/điểm cần chú ý | Đề xuất action |
|---|---|---|---|
| Auth/store & staff onboarding | Có Store/customer auth, legacy auth compatibility, staff invite; một số HTTP tests [S03][S16]. | A/B order privacy, expired token, tách admin actor/customer và privilege matrix. | Negative authz tests, role table và browser Admin walkthrough. |
| Product/Catalog/Price | Medusa Product/Pricing API, sales channel, region/VND; search `q` và catalog route [S04][S13]. | Caching/search consistency, published/unpublished, variant price/availability. | Test region/channel/price tampering và out-of-stock. |
| Cart Store API | Native SDK `/store/carts` + legacy `/store/cart`; đã vá DTO/trust-boundary và cross-cart item deletion [S03][S16]. | Guest cart capability semantics, cart ID cookie, API misuse, quantity extremes. | Regression native+legacy paths, anonymous vs authenticated. |
| Checkout/Order creation | Storefront hoàn tất Medusa cart, HTTP test successful order; order readback [S16]. | Race/double click, lost response after commit, payload mismatch, timeout handling. | Viết kịch bản two parallel completes + retry-after-timeout + readback. |
| COD/manual payment | `pp_system_default`, không đồng nghĩa collected/captured [S03]. | Báo cáo và UI có thể nhầm authorize=thu tiền. | State model COD accepted/collected/refunded rõ. |
| Payment Simulator | Custom provider success/failure, non-production gate [S04][S16]. | Không được bật trên môi trường production; chưa test xử lý retry đồng thời đủ rộng. | Test env flag, unauthorized provider, success/failure/retry. |
| Payment idempotency | Tài liệu đặc tả yêu cầu nhưng chưa đủ evidence của bản mới [S03]. | High data integrity risk. | Xem hành vi Medusa 2.21.2 trước khi viết cơ chế mới; ADR + tests. |
| Inventory reservation | Từng đối soát success/fail/cancel snapshot [S03][S16]. | Last-unit contention, cancel/fulfill và concurrency safety chưa chứng minh. | 20 requests/5 units + DB snapshot/order/payment reconciliation. |
| Order status & Fulfillment | Medusa core có workflows; chưa hoàn chỉnh walkthrough staff [S03][S04]. | Tracking thủ công và quy tắc chuyển trạng thái/role còn OPEN. | Chốt state/permissions, chạy staff lifecycle từng bước. |
| Notifications | Redis event bus + worker có; subscriber README ghi delivery chưa làm [S15]. | Thiếu provider/send, persisted delivery outcome, bounded retry, duplicate/out-of-order protection. | Thiết kế event contract, Medusa subscriber, sandbox provider và tests. |
| Admin/Reports | Build Admin và CLI invite đã từng kiểm chứng local [S03]. | Basic report theo kỳ và COD status chưa được nghiệm thu; không nên viết Admin thay thế. | Reuse Medusa Admin, thêm read-only report slice nếu thật thiếu. |
| Recommendation | GET recommendations có `ENABLE_RECOMMENDATIONS`, cap concurrent/timeout/fallback/region, lọc saleable [S19]. | Candidate quality, cache across replicas, public image/license, 30 RPS cloud chưa kiểm. | Bật tắt độc lập; chỉ nghiệm thu REC nếu đủ data/legal/perf. |
| Personalization | `for-you` cần authenticated customer, consent, profile epoch; flag riêng [S19]. | Dữ liệu profile thật/chất lượng, consent revocation, privacy regression. | Giữ flag off mặc định nếu chưa hoàn tất evidence. |
| Health/workers | Backend API/Admin và worker hai vai trò; bản local 15/11 đã chạy `/health` và `/app` [S03]. | Health != readiness, worker business events và khả năng recover sau restart. | Health/readiness + event processing smoke + log correlation. |
| Middleware/validation | Runtime body validation, auth context và workflow check cart item [S14][S16]. | Các route custom khác cần threat review; no rate limits global chứng minh. | API inventory, request schema, authorization matrix. |

### 3.3. Transaction correctness là cổng P0

Một test thành công chỉ chứng minh luồng đơn lẻ. Để nghiệm thu phải quan sát **cùng một intent** được gửi hai lần đồng thời, gửi lại sau timeout, đổi payload và tranh chấp last stock. Xác minh không có Order/Payment effect trùng và `reserved_quantity`, stocked/available cùng đúng; kết quả phải đọc từ Medusa/PostgreSQL test riêng. Với failure, không hiển thị order confirmation giả; với COD không nói “đã thu tiền”. Không chỉnh bảng thương mại trực tiếp, chỉ dùng Medusa workflow.

### 3.4. Ranh giới chức năng của Hoàng và Trung

- **Hoàng sở hữu** state machine, hành vi thay đổi nghiệp vụ, route/workflow Medusa, customer/staff authorization, payment, fulfillment và notification; tạo test backend tương ứng.
- **Trung sở hữu** fixture, quan hệ dữ liệu, migration, chất lượng dữ liệu, truy vấn/reporting dataset và đối soát DB. Trung *không* chịu trách nhiệm viết toàn bộ Medusa Admin hay fulfillment workflow.
- Admin báo cáo tối thiểu: Trung định nghĩa nguồn/aggregation và cách đối soát; Hoàng tạo API/giao diện mở rộng nếu Medusa mặc định không đủ; Quân test độc lập.

**Ưu tiên Hoàng:** (B-P0-01) concurrency/idempotency; (B-P0-02) event notification; (B-P0-03) staff/fulfillment order status; (B-P0-04) role and data boundary; (B-P1-05) report API; (B-P1-06) tracing/service errors.

## 4. OPS + CI/CD — THẮNG (DevOps / Cloud / Release)

### 4.1. Sơ đồ hạ tầng đang được cấu hình

Hướng AWS hiện tại là ALB HTTPS, ECS Fargate Storefront + Medusa API/Admin + worker; RDS PostgreSQL Single-AZ, Redis trên EC2, private S3 với route proxy ảnh, CloudWatch; CloudFormation với các stack `foundation`, `data`, `app`. Một máy Redis và Single-AZ RDS vẫn là điểm lỗi đơn, không được gọi multi-AZ HA [S07][S08]. `ap-southeast-2` và các DNS DAYMARK demo được cấu hình; không kiểm tra live DNS/availability tại thời điểm audit.

### 4.2. CI/CD: phân tích từng công đoạn

| Hạng mục | Code/config đã có | Nhận xét & gap | Trách nhiệm Thắng |
|---|---|---|---|
| GitHub Actions CI | `.github/workflows/ci.yml` chạy trên PR/push; docs/presentation, cfn-lint/Guard, backend unit, `npm test`, lint, typecheck, build, Docker image [S10]. | Chưa kiểm chứng run mới nhất cho main `084f229`; coverage khớp yêu cầu chưa hoàn chỉnh. | Tập hợp CI status theo SHA, artifact và gate. |
| HTTP integration workflow | `.github/workflows/api-tests.yml` dùng PostgreSQL 16 service, Jest HTTP [S10]. | Môi trường dùng `REDIS_URL=""`, nên không đại diện hoàn toàn worker/Redis thật. | Giữ test nhanh và thêm smoke Redis/worker riêng. |
| Browser E2E in CI | Playwright config/spec có trong storefront [S17]. | Không thấy bước `playwright test` trong `ci.yml`; regression browser chưa là required check. | Build seed disposable, install Chromium, chạy E2E, upload traces/video. |
| Unit + build gate | CI có lint/typing/backend/frontend builds, Compose validation [S10]. | Build pass không chứng minh checkout/Staff lifecycle. | Thêm business smoke sau build, fail fast trên test trọng yếu. |
| Dependency audit | `npm audit --omit=dev --audit-level=high` **`continue-on-error: true`** [S10]. | Báo cáo 15/11 ghi 23 high/0 critical; scan không block CI. | Chốt triage, override/upgrade an toàn, policy release blocking có owner. |
| IaC validation | `cfn-lint`, AWS Guard, Python tests và syntax check trong CI [S10]. | Không kiểm chứng IAM/policy runtime/thay đổi AWS trong tài khoản chỉ từ lint. | Chạy plan change set và review stateful replacement. |
| Image publishing | `.github/workflows/aws-images.yml` có OIDC/ECR digest artifact; manual workflow [S10]. | Runbook ghi workflow publish được cấu hình nhưng lần live trước build bằng local Docker/CLI, chưa chứng minh GitHub publish end-to-end [S08]. | Chạy publish thử được duyệt; ghi digest SHA và artifact. |
| Release orchestration | `deploy/cloudformation/manage.py` và runbook hỗ trợ start/pause/hibernate/apply/migrate [S07][S08]. | Chưa có automated AWS release pipeline đủ gate; thao tác AWS phải phê duyệt. | Viết script/checklist release/rollback được review, tránh đổi stateful. |
| EC2 fallback | `.github/workflows/deploy.yml` deploy qua SSH manual [S10]. | Không nên nhầm với luồng Fargate chính; rollback tự động chưa chứng minh. | Giữ fallback tách biệt và có quy trình rõ. |
| HTTPS/media | AWS đã từng công khai catalog/admin/HTTPS và byte-accurate S3 proxy, 18 public checks [S09]. | Chỉ là bản 09/11, không phải release 15/11; proxy ảnh ăn capacity API. | Cloud smoke lại media/security và kiểm băng thông. |
| Observability | CloudWatch dashboard/alarms, ECS/ALB/RDS metrics trong IaC [S07][S08]. | Business tracing/notification queue metrics chưa đầy đủ; nhận email SNS từng pending confirmation. | Alert drills, logs correlation, operational metrics. |
| Availability/lease | Có shutdown watchdog/lease, pause/hibernate và spend alerts [S07]. | Lịch sử lease 09/11 đã hết; không biết hiện các task/RDS đang chạy hay đã dừng. | Đọc AWS state/billing trước deploy; không đo availability ngoài cửa sổ công bố. |
| Load/performance | `load/catalog.js` 30 RPS, `load/checkout.js` 3 journeys/s, recommendations k6 [S20]. | Script checkout cần business readback, peak scenario và báo cáo tài nguyên; chưa có accepted AWS benchmark. | Phối hợp Quân hoàn thiện workload, lưu raw reports. |
| Backup/restore/rollback | Runbook có snapshot, previous digest, recovery guard [S08]. | Chưa có restore drill có thời gian và readback; không tự rollback DB migration. | Diễn tập DB cô lập, phục hồi ứng dụng bằng digest cũ, RPO/RTO. |
| Cost/FinOps | Cost estimate cũ $168.17/tháng always-on, excluding extras; mục tiêu kế hoạch $100/tháng [S07][S08]. | Budget chưa chốt; ALB/logs/storage vẫn tính phí lúc compute ngừng. | Cost sheet hiện tại, lease schedule, approval trước spend. |

### 4.3. Phân biệt `configured` và `verified on AWS`

- **Có bằng chứng triển khai lịch sử:** 09/11 build/migrate, các dịch vụ ECS steady, 18 public checks với `main` `389e855`, RDS snapshot trước deploy [S09].
- **Chưa có bằng chứng mới:** release DAYMARK `084f229`, kết quả Playwright cloud, full checkout/cancel/fulfill/notification trên AWS, restore drill, load peak/recovery và alarm receipt.
- **Giới hạn kiến trúc:** Redis trên EC2 không dùng TLS trong thiết kế demo, RDS Single-AZ, proxy ảnh qua API, không có CloudFront; đây là trade-off và rủi ro cần ghi trong báo cáo, không quảng bá production-grade HA.

**Ưu tiên Thắng:** (O-P0-01) CI E2E + fail gates; (O-P0-02) security audit triage; (O-P0-03) release immutability và smoke; (O-P1-04) staging AWS theo phê duyệt; (O-P1-05) k6/alerts/restore; (O-P1-06) cost approval/report.

## 5. DATA — TRUNG (Database / Data Engineering)

### 5.1. Nguồn dữ liệu và tình trạng schema

Medusa/PostgreSQL giữ dữ liệu Customer, Product, Price, Cart, Order, Payment, Inventory và Fulfillment; các model Recommendation/Personalization có migrations riêng. Redis là cache/queue coordination, không được coi là nguồn order. Không tạo bản ghi order từ giao dịch H&M lịch sử, không ghi trực tiếp tables core để vượt workflow [S04][S05][S06].

### 5.2. Kiểm kê chi tiết data

| Hạng mục Data | Hiện trạng được ghi nhận | Lỗ hổng/không được suy diễn | Công việc của Trung |
|---|---|---|---|
| Catalog DAYMARK | Fixture **30 products / 230 SKU**, 3 collections, 6 categories, **2.554 units** tồn kỳ đầu trong tài liệu [S06]. | Đó là fixture/manifest dự kiến; không chứng minh đúng số trên DB AWS của release mới. | Chạy dry-run/apply trong DB disposable; count products/variants/inventory thật. |
| Media catalogue | 30 ảnh sản phẩm đại diện và 4 editorial assets, có manifest [S06]. | Ảnh minh họa không khẳng định đúng từng màu/size SKU hoặc có quyền công bố ảnh H&M. | Manifest checksums/ownership, xác minh upload URL/S3 proxy. |
| Seed commerce | `seed-commerce.ts` tạo vùng/kênh/kho/giá/shipping cơ bản; importer DAYMARK tách rời [S06]. | Không chạy lại bừa trên AWS; không khôi phục dữ liệu bằng reseed. | Idempotency/ownership guards và release fixture recipe. |
| Importer DAYMARK | Có dry-run, apply có cờ bảo vệ và local-disposable restriction; không reset stock đang có [S06]. | Không cam kết atomic all-batches hoặc multi-writer concurrent importer. | Negative tests SKU collision, unexpected handle, bad media checksum, rerun no duplicates. |
| Migrations | Medusa DB schema và module migrations; AWS 09/11 chạy 4 migrations reco/personalization [S09]. | Schema production bản mới chưa đối chiếu, downgrade không tự động. | Migration plan, DB diff và readback trên clone/disposable. |
| Giá VND/region/channel | Medusa là nguồn giá, fixture có integer VND [S03][S06]. | Không tự suy giá H&M; UI/server total phải khớp ở checkout. | Data contracts cho price snapshots, shipping/tax; sample reconciliation. |
| Inventory | Mức stocked/reserved do Medusa workflow cập nhật [S03]. | Tồn trên DB test thành công chưa là bằng chứng tranh chấp; không sửa SQL thủ công. | Snapshot trước/sau và reconciliation cùng Hoàng/Quân. |
| Order/Payment/Fulfillment | PostgreSQL là nguồn trạng thái liên quan [S05]. | Không đồng nhất authorized/captured/collected, reservation/shipped. | Data dictionary/state mapping, query/exports phục vụ readback. |
| Report dataset | Nhu cầu báo cáo cơ bản theo khoảng thời gian và trạng thái [S04]. | Dashboard Admin chưa chứng minh đối soát; không gọi value order = doanh thu thực/COD thu. | Định nghĩa chỉ số, aggregation read-only, fixtures và test tổng. |
| Index/query/connection | Có query/Store API, Redis cache; docs nêu nguy cơ connection pool và sort toàn bộ [S03]. | Chưa có slow-query log/explain/tuning, nhất là 120/1000 sản phẩm thử. | EXPLAIN/benchmark/query counts, index proposal nếu cần. |
| Recommendation/H&M | ETL, importer H&M, offline candidate và API serving tồn tại [S19][S21]. | Dữ liệu H&M nghiên cứu có giới hạn quyền; không được công bố/cá nhân hóa vô điều kiện. | Data provenance, version, quality, separate from DAYMARK catalog. |
| Customer personalization | Consent/Profile/Event models, API feature-flagged và scope theo customer [S19]. | Không có chứng cứ đã đủ consent/retention/withdrawal test trên cloud. | Test purge/epoch/versioning/data minimization cùng Hoàng/Quân. |
| Backup/restore/PII | RDS snapshot đã có lịch sử, data retention/PII policy còn mở [S09][S05]. | Snapshot không bằng restore drill; thông tin cá nhân không đưa vào test artifact. | Restore verification, masking fixtures và data handling checklist. |

### 5.3. Quy tắc dữ liệu bất biến cần có evidence

1. **Một ý định checkout không tạo nhiều hiệu ứng thương mại**; Order ID, Payment Session/Collection và stock reservation khớp.
2. **Không oversell:** tổng cam kết cùng SKU không vượt khả dụng theo chính sách; kết quả fail/timeout được đối soát.
3. **Không thay đổi dữ liệu do seed/import lại:** rerun không tạo trùng SKU, không overwrite stock đã đổi do mua/hủy.
4. **Không nhầm doanh thu/cash:** COD đã nhận đơn ≠ đã thu; chỉ số báo cáo phải nêu trạng thái, khoảng thời gian, VND.
5. **Không lẫn dữ liệu H&M và DAYMARK:** source/rights/transform version/consent phải tách; không biến `transactions_train.csv` thành Medusa Orders.

**Ưu tiên Trung:** (D-P0-01) DB baseline/schema/data counts; (D-P0-02) reconciliation order/payment/inventory; (D-P0-03) importer/seed safety; (D-P1-04) report data; (D-P1-05) index/load & restore; (D-P2-06) recommendation evaluation datasets nếu dữ liệu hợp pháp.

## 6. QA + TESTING + DOCUMENTATION — QUÂN

### 6.1. Kiểm kê hệ thống test hiện hữu

| Lớp test | Đã có | Evidence hiện tại | Khoảng trống nghiệm thu |
|---|---|---|---|
| Backend unit | Jest, tests module/script DAYMARK và recommendation [S03][S16]. | Local báo **121 tests / 13 suites** ngày 15/11 (trên ngữ cảnh working tree). | Phải chạy lại trên đúng SHA release, lưu junit/report. |
| Backend HTTP integration | `auth-catalog-search.spec.ts`, `checkout-order.spec.ts`; test store API/payment/stock [S16]. | Local báo **24 tests / 2 suites** ngày 15/11 trên PostgreSQL riêng. | Concurrent retry/timeout/A-B order, staff fulfillment/notification còn thiếu. |
| Playwright browser | Specs auth/history, cart, catalog, checkout COD, design system, responsive [S17]. | Nhánh/báo cáo 09/11 có 11/11 pass trên UI cũ; thiết kế mới PR #14 chưa có full browser run xác minh tại audit. | Chạy full suite trên `084f229` hoặc RC mới, video/trace và negative states. |
| CI tests | GitHub CI: docs, CloudFormation, unit, integration, lint/typecheck/build [S10]. | Có workflows; không truy vấn live status của mọi job mới nhất. | Gắn Playwright với môi trường dùng riêng; không chỉ lưu ảnh local. |
| k6 catalog/checkout | `load/catalog.js`, `load/checkout.js`, `load/recommendations.js` [S20]. | Scripts với thresholds bước đầu; chưa có accepted cloud benchmark của release mới. | Arrival rates, dropped iterations, readback và load profile 5x. |
| Security | Tests boundary và audit dependency [S03][S10]. | Có security controls/test một phần; 23 high audit lịch sử. | Test role A/B, staff/admin, storage/media, secrets, attack surfaces và triage. |
| Cloud smoke | Báo cáo 09/11 có **18/18 public checks** [S09]. | Historical cloud, khác SHA hiện tại. | Sau deploy mới: storefront–API–DB–worker, media, checkout, alerts. |
| Recovery/Resilience | Runbook/backup snapshot và chiến lược rollback [S08]. | Restore drill và rủi ro RPO/RTO chưa đo. | Test data restore cô lập, worker restart/Redis fault với kỳ vọng. |
| Recommendation eval | Tests/fault scenarios riêng trong docs/recommendation [S21]. | Kết quả ở các nhánh/đợt lịch sử, nhiều quality/rights/human labels chưa có. | Chỉ nghiệm thu REC tùy chọn nếu có dữ liệu được phép, control baseline và quality review. |

### 6.2. Test matrix bắt buộc lập mới theo release

| Test ID | Hành trình / trường hợp | Owner triển khai | Người kiểm thử, bằng chứng |
|---|---|---|---|
| QA-01 | Register/login/logout, wrong password, expired token, order A/B, staff token không truy cập customer/admin trái quyền | Quý + Hoàng | Quân: Playwright + HTTP 401/403 + logs sạch |
| QA-02 | Search/filter/sort 120+ items, category empty, published/unpublished, variant price/VND | Quý + Hoàng + Trung | Quân: count/order/metadata vs Medusa |
| QA-03 | Cart add/update/remove, invalid qty/cart item/cross-cart, reload | Quý + Hoàng | Quân: E2E + integration, server totals |
| QA-04 | COD checkout success → order confirmation/history/admin readback | Quý + Hoàng + Trung | Quân: order ID, item, money, reserved stock |
| QA-05 | Simulator fail, no false confirmation/no unintended order/stock | Quý + Hoàng | Quân: HTTP/E2E + DB readback |
| QA-06 | Double click/parallel complete/retry after timeout; 20 attempts vs 5 units cuối | Hoàng + Trung | Quân: concurrent report and reconciliation |
| QA-07 | Staff invite/login/RBAC → receive inventory/publish/fulfill/track/COD report | Hoàng + Trung | Quân: witnessed Admin walkthrough + screenshots |
| QA-08 | Order event notification, provider down/retry/recover, duplicate/stale event | Hoàng | Quân: fake provider, sandbox inbox, delivery state |
| QA-09 | Recommendation ON/OFF/503/consent/no consent, no checkout impact | Quý + Hoàng + Trung | Quân: feature-flag matrices |
| QA-10 | Cloud rollout HTTPS/migration/media/monitoring/alarm/rollback/restore | Thắng + Hoàng + Trung | Quân: cloud E2E + evidence index |
| QA-11 | k6 baseline/peak/recovery; CPU/RAM/DB/Redis/ALB/cost | Thắng + Trung | Quân: thresholds + raw data, dated environment |

### 6.3. Documentation: tình trạng và bất đồng cần giải quyết

**Điểm mạnh:** Docs mới phân lớp nguồn nghiệp vụ (BRD/actors/rules/SRS) và kỹ thuật (`docs/spec/03-architecture`, `04-data-api`, `05-testing`, `06-operations`, `07-delivery`), thêm traceability và data ownership. Nhận diện DAYMARK đã có quyết định của người yêu cầu ngày 15/11. Tài liệu cũ về Fastify/Prisma hoặc kế hoạch Tuần 4–13 không còn là mô tả kỹ thuật đang chạy [S01][S02][S03].

**Khoảng trống:** Sổ nguồn và giả định còn trạng thái Draft/Open cho guest checkout, staff roles, order/fulfillment status, price snapshot, stock reservation, notification channel, basic report definition và SLO. Một đoạn `docs/spec/07-delivery.md` vẫn nói PR #14 draft/open ở snapshot khi viết, trong khi GitHub cho thấy PR đã merge 15/11; phải ghi rõ **historical note vs current merge state**. `npm run docs:check` mới kiểm file/link, chưa tự chứng minh các quy tắc nghiệp vụ đã được phê duyệt hoặc mọi fragment hợp lệ [S03][S05][S11].

**Bộ tài liệu cần bàn giao:** Requirement Traceability Matrix (FR→code→test→evidence→owner); API/flow matrix; data dictionary/ERD; ADR idempotency/notification/cache/AWS trade-offs; security/threat checklist; test reports; performance/availability/recovery/FinOps với số đo; release notes; user/staff walkthrough và demo script. Không phát hành kết luận PASS nếu evidence chưa chạy.

**Ưu tiên Quân:** (Q-P0-01) RTM+test plan thực thi; (Q-P0-02) E2E main mới; (Q-P0-03) bug triage và regression; (Q-P0-04) độc lập nghiệm thu transaction/role/notification; (Q-P1-05) cloud load/restore reports; (Q-P1-06) docs release package.

## 7. CHẤT LƯỢNG PHI CHỨC NĂNG (NFR) VÀ ĐIỀU KIỆN THOÁT

Các số dưới đây là **TARGET**, không được viết thành “đã đạt”. Dữ liệu thử có tách riêng, không tác động vào DB demo/khách đang giữ; mọi số đo phải gắn môi trường/commit/task limits [S04][S20].

| Mã NFR | Mục tiêu | Evidence tối thiểu cần có | Nhóm phụ trách |
|---|---|---|---|
| NFR-PERF-01 | **30 RPS catalog trong 10 phút**, p95 API **<600 ms**, lỗi **<1%**, không dropped iterations | k6 raw JSON + biểu đồ RPS/latency + cache/DB/resource context | Thắng, Quân, Trung |
| NFR-PERF-02 | **3 checkout journeys/s trong 5 phút**, p95 complete **<1.500 ms** | k6 + order/payment/stock readback; phân loại lỗi có chủ đích | Hoàng, Trung, Quân |
| NFR-PEAK-01 | **150 RPS browse trong 5 phút**, p95 peak **<1.200 ms**, trở về nền sau hạ tải | k6 ramp/steady/recovery + ECS scale/DB connection metrics | Thắng, Quân |
| NFR-REL-01 | **20 concurrent attempts/5 last units**: không duplicate/oversell | concurrent fixture + transaction invariants + DB snapshots | Hoàng, Trung, Quân |
| NFR-NOTIFY-01 | ≥**95%** thông báo thử bình thường trong **60 s**, retry hữu hạn | sandbox delivery timestamps, fail/recovery/dedupe | Hoàng, Quân |
| NFR-OBS-01 | Tiêm lỗi → alert được nhận trong **≤5 phút** | CloudWatch alarm state, người nhận xác nhận, UTC timeline | Thắng, Quân |
| NFR-RECOVERY-01 | RPO **≤60 phút**, RTO **≤120 phút** | Restore **DB cô lập**, timestamps/checkpoints/readback | Thắng, Trung, Quân |
| NFR-AVAIL-01 | **99,5%** probes trong **cửa sổ demo công bố**, không phải 24×7 | probe log với mẫu số và thời gian | Thắng, Quân |
| NFR-COST-01 | Trần kế hoạch **100 USD/tháng** chưa được duyệt, so với model cũ 168.17 USD always-on trước biến phí | cập nhật pricing, budget approval, usage schedule, bill | Thắng, Quý |
| NFR-REC-01 (tùy chọn) | p95 recommendation **<800 ms @30 RPS**, không ảnh hưởng checkout | k6 riêng + quality/rights/consent evidence | Hoàng, Trung, Quân |

## 8. BACKLOG ƯU TIÊN, PHỤ THUỘC VÀ NGHIỆM THU 3 TUẦN

### 8.1. Backlog phải có owner

| Task ID | Ưu tiên | Owner | Việc cần chốt | Bằng chứng đóng task |
|---|---|---|---|---|
| P0-01 | P0 | **Hoàng** + Trung/Quân | Duplicate/retry idempotency và last-unit inventory | Concurrent tests + Order/Payment/Stock readback |
| P0-02 | P0 | **Hoàng** + Quân | Transactional notification provider + subscriber + retry/dedupe | Provider fail/recover + sandbox receipts + no order rollback |
| P0-03 | P0 | **Hoàng** + Trung/Quân | Staff/Admin order lifecycle, manual tracking, COD policy/role | Walkthrough, API authorization & report reconciliation |
| P0-04 | P0 | **Quý** + Quân | Regression toàn bộ DAYMARK UI/route, checkout/account mobile | Playwright của đúng release SHA + screenshots |
| P0-05 | P0 | **Thắng** + Quân | CI Playwright gate, audit vulnerability triage | CI required checks + audit disposition + clean artifacts |
| P0-06 | P0 | **Thắng** + cả nhóm | AWS release mới: staging, migrations, full cloud smoke | Digest/SHA, HTTPS, checkout/worker, logs & rollback plan |
| P1-07 | P1 | **Trung** | DB/fixture/importer migration and reporting baseline | DB counts, dry-run/apply/rerun, data dictionary, report fixtures |
| P1-08 | P1 | **Thắng** + Trung/Quân | Load/alerts/restore & FinOps | k6 thresholds + alert receipt + isolated RPO/RTO + budget |
| P1-09 | P1 | **Quân** + Quý | RTM, policy/decision OPEN, SRS, QA docs | Reviewed crosswalk, test evidence index, approved issues |
| P2-10 | P2 | **Trung** + Hoàng/Quý | Recommendation extended quality/personalization | Rights + consent + offline human evaluation + p95; nếu thiếu giữ flag OFF |

### 8.2. Chuỗi phụ thuộc bắt buộc

1. **Chốt luật** guest, order state, staff quyền, stock reservation, COD/report, notification channel → **Hoàng làm workflow** và **Quân viết expected results**.
2. **Trung chuẩn bị DB/fixture disposable** → Hoàng/Quân chạy concurrent/error tests → Quý sửa UI tương ứng.
3. **Quý hoàn tất customer journey + Quân E2E** → Thắng đưa Playwright vào CI → chỉ build immutable image khi test pass.
4. **Thắng chuẩn bị change set + approval + ngân sách** → AWS staging → cloud E2E/load/restore → Quý chốt GO/NO-GO.

### 8.3. Mốc trong 3 tuần (16/11–06/12)

| Tuần | Mục tiêu bằng chứng | Exit gate |
|---|---|---|
| **Tuần 1 (16–22/11):** Chức năng và integration | DAYMARK storefront + checkout, staff/notification basic implemented, data fixture và test cases; CI ổn định | Các hành trình critical có smoke; P0 blocker rõ người chịu trách nhiệm, không tuyên bố xong khi chỉ code xong. |
| **Tuần 2 (23–29/11):** Regression & evaluation | Test concurrent/role/event, Playwright full, dependency audit triage, k6 baseline, staging cloud (nếu phê duyệt) | Không P0 data/security, release candidate traceable SHA, test evidence mới. |
| **Tuần 3 (30/11–06/12):** Cloud & final acceptance | Hardening/feature freeze, immutable deploy, post-deploy E2E, CloudWatch, rollback/restore, báo cáo/demo | GO/NO-GO có người duyệt; mọi chưa PASS phải ghi PARTIAL/BLOCKED và giới hạn. |

## 9. ĐỀ XUẤT MỨC SẴN SÀNG VÀ QUYẾT ĐỊNH

### 9.1. Giai đoạn hiện nay

- **Tính năng khách hàng:** đủ cơ sở để tập trung regression và polish, **chưa đủ cơ sở ký nghiệm thu frontend**.
- **Giao dịch thương mại:** có code và thử nghiệm tích cực, nhưng **chưa nên công bố an toàn đồng thời/idempotency**.
- **Vận hành nhân viên/notification:** **chưa đóng** các use case bắt buộc.
- **Cloud:** **đã có tiền lệ AWS deploy thành công**, nhưng **không đủ cơ sở nói release DAYMARK mới đang chạy trên AWS**.
- **Test/NFR/Security:** có nền nhưng **chưa qua gate toàn hệ thống**.

### 9.2. GO / NO-GO cho bản phát hành cuối

**GO** khi 9 use case bắt buộc có evidence PASS; test auth/order/stock/payment/notification/Staff đạt; không có P0; Playwright và backend CI đạt cùng release SHA; audit security được review và không còn high reachable chưa xử lý không được chấp nhận; cloud HTTPS + E2E + alert + rollback + restore drill có bằng chứng; ngân sách được duyệt.

**NO-GO** nếu còn duplicate order/oversell, rò dữ liệu hoặc secret, payment simulator bật production, email failure làm mất order, chưa test cloud cùng release, thiếu rollback/restore an toàn hoặc vượt giới hạn chi phí. Có thể demo **bản giới hạn** trong môi trường cô lập nhưng phải ghi trạng thái thật, không nói production-ready.

## 10. DANH MỤC NGUỒN VÀ DẤU VẾT

Nguồn từ GitHub ưu tiên link tại `main`, trừ khi ghi khác. Báo cáo lịch sử chỉ hỗ trợ kết luận ở thời điểm tác giả đã chạy. Tài liệu cũ trong Project dùng để đối chiếu yêu cầu, không thay thế mã/tài liệu mới.

- **[S00]** Tệp đề bài học phần đã cung cấp: `Cloud Application Development - Project Topics.pdf`, Project 1, trang 4–5, và các Presentation 1–5. Nội dung use case/NFR được đối chiếu trực tiếp.
- **[S01]** [Repository README / code baseline](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/README.md) và [commit 084f229](https://github.com/kieuquy283/EnterpriseE-commercePlatform/commit/084f2297ac00f90cab59692865439a6ba5139855); [frontend package](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/package.json), [backend package](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/package.json).
- **[S02]** [DAYMARK Design System](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/design-system/README.md).
- **[S03]** [Delivery gates & Week6 evidence](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/07-delivery.md), cập nhật có lịch sử ngày 15/11.
- **[S04]** [Functional/business architecture & flows](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/02-flows.md) và [technical requirements mapping](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/technical/requirements-mapping.md).
- **[S05]** [SRS mới](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/03-requirements/SRS.md), [source and assumption register](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/00-project/source-and-assumption-register.md).
- **[S06]** [DAYMARK data catalog/fixture & importer](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/catalog/DATASET.md).
- **[S07]** [AWS CloudFormation guide](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/cloudformation/README.md) và [cost model](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/cloudformation/cost-estimate.json).
- **[S08]** [AWS Operations Runbook](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/RUNBOOK.md) và [Security/Ops spec](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/06-operations.md).
- **[S09]** [AWS latest-main redeploy report 09/11](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/report/aws-redeployment-main389e855-2026-11-09.md) và [Fargate deployment report 08–09/11](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/report/aws-fargate-deployment-2026-11-08.md).
- **[S10]** [GitHub CI](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/.github/workflows/ci.yml), [HTTP integration workflow](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/.github/workflows/api-tests.yml), [AWS image publishing](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/.github/workflows/aws-images.yml), [EC2 fallback deploy](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/.github/workflows/deploy.yml).
- **[S11]** [PR #14 DAYMARK redesign + catalog](https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/14) (merged 15/11/2026).
- **[S12]** [PR #15 notification status docs + Medusa skills](https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/15) (merged 15/11/2026).
- **[S13]** [Products data layer](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/src/lib/data/products.ts), [cart data layer](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/src/lib/data/cart.ts), [customer data layer](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/src/lib/data/customer.ts), [catalog template](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/src/modules/store/templates/index.tsx).
- **[S14]** [Medusa config](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/medusa-config.ts), [middlewares](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/api/middlewares.ts), [custom cart route](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/api/store/cart/route.ts).
- **[S15]** [Subscriber status README](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/subscribers/README.md) và [Admin extension note](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/admin/README.md).
- **[S16]** [Auth/catalog/cart HTTP tests](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/integration-tests/http/auth-catalog-search.spec.ts) và [Checkout/order HTTP tests](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/integration-tests/http/checkout-order.spec.ts).
- **[S17]** [Playwright configuration](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/playwright.config.ts), [auth/order](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/e2e/account-order-history.spec.ts), [checkout](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/e2e/checkout-cod.spec.ts), [design system](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/e2e/design-system.spec.ts).
- **[S18]** [Frontend recommendations adapter](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/storefront/src/lib/data/recommendations.ts).
- **[S19]** [Recommendations API](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/api/store/recommendations/route.ts) và [For-you API](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/src/api/store/recommendations/for-you/route.ts).
- **[S20]** [NFR/test specification](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/05-testing.md), [catalog load](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/load/catalog.js), [checkout load](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/load/checkout.js), [recommendation load](https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/load/recommendations.js).
- **[S21]** [Recommendation research reports](https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/main/docs/recommendation) — lịch sử từng module, không suy ra quality/human rights accepted.

---

**Nguyên tắc cập nhật báo cáo:** Sau mỗi lần đổi `main` hoặc deploy, cập nhật SHA, ngày giờ, nguồn code, command đã chạy, test raw result, trạng thái Cloud, chi phí và người xác nhận. Giữ các báo cáo lịch sử bất biến. Chỉ thay **PARTIAL/GAP** thành **PASS** sau khi có đủ bằng chứng tương ứng.
