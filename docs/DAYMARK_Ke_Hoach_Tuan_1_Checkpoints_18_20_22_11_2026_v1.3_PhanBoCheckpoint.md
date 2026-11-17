# DAYMARK — KẾ HOẠCH THỰC HIỆN TUẦN 1
**Feature Completion · Integration · Test Foundation**
**Thời gian:** 16–22/11/2026 · **Phiên bản:** 1.3 · Checkpoint chính theo task · Staff/Admin RBAC · **Baseline:** `main`/`084f229` (15/11/2026)
**Mục tiêu:** chuyển hệ thống từ có code sang ứng viên Feature Complete trên môi trường tích hợp, làm cơ sở kiểm thử/staging Tuần 2.

# 1. Tổng quan, phạm vi và mục tiêu

**Trạng thái đầu vào.** PR #14 và #15 đã merge; DAYMARK có Next.js storefront, Medusa v2, dữ liệu 30 sản phẩm/230 SKU, payment simulator, recommendation, CI/CloudFormation và bằng chứng AWS 09/11. Tuy nhiên chưa chứng minh full E2E của UI mới; checkout retry/concurrency, notification, Staff lifecycle và security audit còn khoảng trống. Đây là thông tin audit, không phải kết quả test mới trong tuần.

**Đích Tuần 1.** Đến tối 22/11 có một ứng viên Feature Complete (RC1) trên môi trường local/integration cô lập: 9 nhóm nghiệp vụ có code hoặc blocker có chủ, các hành trình cốt lõi có automated/manual smoke, CI có quy trình test lặp lại và bộ bằng chứng QA. Tuần 2 làm regression/NFR/staging, Tuần 3 phát hành cuối và nghiệm thu cloud.

## 1.1. Phạm vi bắt buộc và không làm trong tuần

- P0 / Bắt buộc: FR-01..09 (Auth, Catalog, Cart, Checkout, Payment, Inventory, Tracking, Notifications, Admin/Reporting), an toàn giao dịch, frontend responsive, quyền riêng tư, CI và QA test nền tảng.
- P1 / Khi P0 ổn định: trải nghiệm tốt hơn, quality/reporting slice, Playwright CI hardening, cloud read-only readiness, cache/query hiệu năng theo số liệu.
- P2 / Không làm mới: LLM chatbot, thanh toán thật, tracking hãng vận chuyển thật, dashboard tùy chỉnh lớn, hệ thống tìm kiếm riêng, AI gợi ý phức tạp, bulk H&M công khai.
- Không làm trên AWS production/demo data: reseed/overwrite stock, drop DB, migration thử nghiệm, tạo stack tốn phí hay thao tác hủy tài nguyên. Dùng DB riêng có thể bỏ cho thử viết.

## 1.2. Phân vai và ranh giới sở hữu

| Thành viên | Role / phạm vi sở hữu | Không phải trách nhiệm chính |
| --- | --- | --- |
| Quý | Tech Lead; toàn bộ frontend, UI/UX, frontend integration, architecture/PR review | Không viết thay test QA hoặc logic inventory/payment core |
| Thắng | DevOps/Cloud; CI/CD workflows, test execution, Docker/AWS, audit/observability | Không viết mọi test case nghiệp vụ hay tự deploy AWS khi chưa duyệt |
| Hoàng | Backend Medusa; API/workflow, order/payment/inventory correctness, notification, Staff lifecycle | Không sở hữu dữ liệu test/ERD chính hoặc xây lại Medusa Admin |
| Trung | Data engineering; Postgres, ERD, migrations, import, reconciliation, reporting data | Không code Medusa Admin UI, fulfillment workflow hay frontend |
| Quân | QA/Testing/Docs; test plan/Playwright, bug evidence, RTM, sign-off | Không phát triển tính năng frontend |

## 1.3. Định nghĩa trạng thái và Done

- CODED: mã/config đã có nhưng chưa chứng minh nghiệm thu; IMPLEMENTED: chạy được trên môi trường được nêu; VERIFIED: có report theo commit, fixture, kết quả và người chạy.
- PASS/FAIL/BLOCKED/NOT RUN là trạng thái test, không gán PASS khi mới đọc source hay nhận mô tả từ PR.
- Task chỉ Done khi có: code/PR, link test result, expected-versus-actual, reviewer, cập nhật tài liệu/RTM và không có blocker P0 ẩn.
- Feature freeze dự kiến 18:00 ngày 20/11; sau thời điểm đó ưu tiên sửa lỗi và regression, thay đổi scope phải được Tech Lead chấp thuận.

# 2. Ba mốc kiểm tra tiến độ — 18, 20 và 22/11

**Cách triển khai:** Các task ở Mục 3 được giao theo **work package**, không ấn định lịch thực hiện từng ngày. Mỗi task có **checkpoint chính** là mốc cần trình bày đầu ra ưu tiên, không phải tự động là ngày đóng task. Thành viên chủ động thực hiện song song trong tuần; nhóm chỉ **kiểm tra kết quả chính thức vào ba mốc** dưới đây. Task có thể xuất hiện tại nhiều lần check với mức hoàn thiện khác nhau; chỉ đánh dấu Done khi đạt điều kiện và có evidence.

## 2.1. Lịch check và exit gate

| Mốc kiểm tra | Nội dung review | Output cần có |
| --- | --- | --- |
| **18/11 · 21:00** | **CHECKPOINT 1 — Baseline & first evidence.** Chốt scope/FR, ranh giới API và nguồn dữ liệu; trình bày smoke ban đầu, test harness, CI baseline, các policy cần duyệt. Không yêu cầu mọi tính năng phải hoàn tất. | Từng người cập nhật task IDs, PR/commit, test đã chạy, bug/blocker và quyết định cần hỗ trợ. |
| **20/11 · 21:00** | **CHECKPOINT 2 — Integration & feature freeze.** Review các luồng mua hàng (Auth, Catalog, Cart, Checkout, Payment/Inventory), bản Staff/Notification đầu tiên và CI/Playwright. Freeze tính năng mới lúc 18:00. | Có demo trên local/test, log test trên cùng SHA, danh sách lỗi P0/P1 và phần carry-over có owner. |
| **22/11 · 21:00** | **CHECKPOINT 3 — RC1 & handoff.** Kiểm tra tổng thể 9 nhóm FR, an toàn giao dịch, notification, Staff, dữ liệu, responsive, CI và QA; chốt release candidate cho Tuần 2. | Gói code + kiểm thử + evidence + RTM + Known issues; quyết định FEATURE COMPLETE / PARTIAL / BLOCKED. |

## 2.2. Checklist theo từng thành viên tại ba mốc

**Quy tắc ghi nhận:** Dấu ☐ là mục cần kiểm, **không phải kết quả đã đạt**. Tại cuộc check, ghi `PASS / PARTIAL / FAIL / BLOCKED / NOT RUN`, kèm link PR, CI run, test report hoặc ảnh/trace và blocker. Mục 3 gồm 36 task (bổ sung BE-08), mỗi task có một checkpoint chính và điều kiện Done; ngày 22/11 vẫn nghiệm thu tổng thể mọi P0.

| Thành viên | Check 18/11 | Check 20/11 | Check 22/11 |
| --- | --- | --- | --- |
| **Quý** | ☐ FE-01, TL-01: route inventory, API contract, bug P0/P1 | ☐ FE-02/03/04/05: demo Catalog/Auth/Cart/Checkout/Order, trạng thái lỗi | ☐ FE-01..07, TL-01: UI/UX và responsive, recommendation fallback, RC1 |
| **Thắng** | ☐ OPS-01/02: môi trường, CI; đầu vào test 3 role và policy | ☐ OPS-02/03/04: tích hợp role-negative HTTP tests + Playwright, Docker smoke | ☐ OPS-01..07: CI role-authz gate và run link, audit, AWS readiness |
| **Hoàng** | ☐ BE-01/02 và **BE-08**: auth/cart, permission matrix + license feasibility | ☐ BE-02/03, BE-08: transaction; thử Staff/Admin allow/deny trên API test | ☐ BE-01..08: notification, Staff/Reporting + chứng cứ RBAC/blocked rõ ràng |
| **Trung** | ☐ DATA-01/02: ERD, schema, fixture/seed baseline | ☐ DATA-02/03/04: dataset readback, stock/payment reconcile, report definitions | ☐ DATA-01..06: data-quality evidence, reconciliation, migration/rights register |
| **Quân** | ☐ QA-01/02: RTM, fixture, AT-10 role matrix cho Customer/Staff/Admin | ☐ QA-04/05: test Staff/Admin allow/deny, lỗi 401/403 ở API và `/app` | ☐ QA-01..07: role regression có log, blocker/QA sign-off |

### 2.2.1. Ma trận checkpoint chính của 36 task

**Cách đọc:** Mỗi task chỉ được liệt kê ở **một checkpoint chính** trong bảng này. Task ở 18/11 hoặc 20/11 có thể tiếp tục sửa lỗi, tích hợp và phải được kiểm tra lại tại nghiệm thu chung 22/11. Task chưa đủ bằng chứng tại checkpoint chính ghi `PARTIAL/BLOCKED` với owner, không tự coi là Done.

| Thành viên | Checkpoint chính 18/11 (8 task) | Checkpoint chính 20/11 (13 task) | Checkpoint chính 22/11 (15 task) |
| --- | --- | --- | --- |
| **Quý** | FE-01 | FE-02, FE-03, FE-04, TL-01 | FE-05, FE-06, FE-07 |
| **Thắng** | OPS-01, OPS-05 | OPS-02, OPS-03, OPS-04 | OPS-06, OPS-07 |
| **Hoàng** | BE-01 | BE-02, BE-08 | BE-03, BE-04, BE-05, BE-06, BE-07 |
| **Trung** | DATA-01, DATA-02 | DATA-03, DATA-04 | DATA-05, DATA-06 |
| **Quân** | QA-01, QA-02 | QA-03, QA-04 | QA-05, QA-06, QA-07 |

**Đầu ra theo mốc:** **18/11** = baseline, môi trường, fixture, ma trận quyền, test plan; **20/11** = demo chức năng và tích hợp, RBAC allow/deny ban đầu, CI/Playwright; **22/11** = regression, rủi ro giao dịch, notification/Staff, báo cáo, RC1. Đây không phải lịch phát triển theo từng ngày.

## 2.3. Kỷ luật làm việc và cập nhật

- Chỉ tổ chức **3 cuộc checkpoint chính thức vào 18/11, 20/11 và 22/11, trước 21:00**. Có thể trao đổi giải quyết blocker ngay khi phát sinh, nhưng **không lập lịch giao task theo từng ngày**.
- 18/11: kết quả và phụ thuộc đã rõ. 20/11: ưu tiên chứng minh tích hợp, **feature freeze lúc 18:00**. 22/11: nghiệm thu local/integration và chốt RC1 hoặc carry-over.
- Nhánh theo task ID, pull request về main; review ít nhất một người khác; không merge PR khi required check thất bại hoặc thiếu giải thích lỗi.
- Mỗi PR có: mục tiêu/FR, thay đổi, test command/result, ảnh hoặc trace nếu UI, migration/data impact, rollback note, known limitations.
- Dữ liệu thử có owner/fixture-version, không lấy kết quả lịch sử 09–15/11 thay lần chạy trên RC1.
# 3. Công việc chi tiết theo từng thành viên

## 3.1. Quý — Tech Lead · Toàn bộ Frontend/UX · Integration & Architecture

**Mục tiêu cá nhân:** Sở hữu mọi thay đổi mã nguồn Storefront DAYMARK, không phân lại phát triển UI cho Quân; đồng thời review hợp đồng API và chốt tích hợp.

**Bàn giao chính:** Storefront feature-complete; UI screenshot set; frontend test-ready checklist; API contract/architecture update; PR review log.

### FE-01 — Kiểm kê và smoke tất cả trang đã merge [P0; checkpoint chính 18/11]

**Thực hiện:** Liệt kê route `/vn`, `/vn/store`, categories, collections, PDP, account/login/register/profile/addresses, cart, checkout, confirmation, orders/detail và trạng thái sai route. Xem lại nhánh code sau PR #14; kiểm điểm các link/nút, loading/empty/error, cookie/cache và route guard; không xây lại UI đã có.  
**Điều kiện Done:** Có bảng route → trạng thái PASS/BUG/NOT RUN; danh sách bug P0/P1 có bước tái hiện; công bố baseline SHA.  
**Phối hợp / phụ thuộc:** Quân cung cấp test matrix; Hoàng kiểm tra API trả dữ liệu.  
**Bằng chứng / bàn giao:** Route inventory + screenshots + PR/issue links  

### FE-02 — Catalog, Search, Collections và PDP [P0; checkpoint chính 20/11]

**Thực hiện:** Sửa luồng tìm kiếm/filter/sort/pagination, đối chiếu published/channel/region, số sản phẩm có thể bán; variant size/màu, VND/stock, trạng thái hết hàng và ảnh lỗi. Không tự tính giá ở client; đối chiếu tập ≥120 sản phẩm nếu Trung cung cấp fixture.  
**Điều kiện Done:** Khách duyệt/tìm/xem biến thể và thêm đúng SKU vào giỏ; tìm không ra có empty state; sort toàn bộ kết quả kiểm được; lỗi API không làm crash.  
**Phối hợp / phụ thuộc:** Trung cung cấp fixture; Hoàng xác nhận catalog APIs; Quân chạy E2E.  
**Bằng chứng / bàn giao:** Catalog/PDP PR + acceptance captures  

### FE-03 — Account, authentication và dữ liệu riêng [P0; checkpoint chính 20/11]

**Thực hiện:** Chốt Register/Login/Logout, Profile/Addresses, account overview; form validation, sai mật khẩu, session hết hạn, tài khoản khác và trạng thái chưa đăng nhập. Thông báo lỗi rõ nhưng không lộ lỗi provider/raw token; giữ auth cookie an toàn.  
**Điều kiện Done:** Guest được dẫn về login theo chính sách; khách A không xem dữ liệu B; update profile/addresses đọc lại đúng; không có đường dẫn giả.  
**Phối hợp / phụ thuộc:** Hoàng xác nhận auth contract; Quân kiểm authz negative tests.  
**Bằng chứng / bàn giao:** Account UI PR + form/error checklist  

### FE-04 — Cart, Checkout và Order Confirmation [P0; checkpoint chính 20/11]

**Thực hiện:** Hoàn thiện add/update/delete, cart empty/reload, địa chỉ, shipping, chọn COD, review tổng tiền server, submit loading/disabled, lỗi payment và retry UX. Sau mất phản hồi không tự cho đặt đơn mới trước khi tra cứu trạng thái; không nói simulator là thanh toán thật.  
**Điều kiện Done:** Một luồng COD hoàn chỉnh đến confirmation đọc được Order ID; double click không biểu diễn hai thành công; payment fail không hiện success; UI kiểm cả guest và member nếu chính sách cho phép.  
**Phối hợp / phụ thuộc:** Phụ thuộc BE-02/03; Quân E2E; Trung đối soát order/stock.  
**Bằng chứng / bàn giao:** Checkout UI PR + recorded run + screenshots  

### FE-05 — Order history/detail/tracking và ngôn ngữ trạng thái [P0; checkpoint chính 22/11]

**Thực hiện:** Hiển thị order history/detail cùng nguồn Medusa, giao hàng thủ công/trạng thái COD đúng ngữ nghĩa đã duyệt; xử lý order 404, khách A/B, các mốc chưa được xác thực. Không dựng lịch sử vận chuyển giả hoặc nói đã thu tiền khi mới COD.  
**Điều kiện Done:** Xem đơn của mình đúng tổng/trạng thái; ngoài quyền bị từ chối; trạng thái hiển thị khớp order/fulfillment event, không suy đoán.  
**Phối hợp / phụ thuộc:** Hoàng chốt state contract, Trung data mapping, Quân negative E2E.  
**Bằng chứng / bàn giao:** Order UI PR + status mapping  

### FE-06 — Responsive, usability và design system [P0; checkpoint chính 22/11]

**Thực hiện:** Đối chiếu palette ngà–than–ô liu, typography Inter, button/field, focus states, layout 375/768/1440px; mobile menu/keyboard Escape/focus restore; ảnh hero và thương mại; no hydration error; reduced motion.  
**Điều kiện Done:** Các trang mua hàng dùng được trên điện thoại/desktop, không có layout overflow hoặc chặn nút; screenshot/trace lưu trong evidence.  
**Phối hợp / phụ thuộc:** Quân chạy `design-system.spec.ts` và `responsive-mobile.spec.ts`.  
**Bằng chứng / bàn giao:** Visual checklist + responsive fixes  

### FE-07 — Recommendation và fallback an toàn [P1; checkpoint chính 22/11]

**Thực hiện:** Smoke Home/PDP khi feature flags ON/OFF, API 404/503/timeout, no-consent; khuyến nghị không chặn giá/giỏ/checkout; giữ mặc định OFF cho cá nhân hóa thiếu quyền dữ liệu.  
**Điều kiện Done:** Core commerce dùng được khi recommendation tắt hoặc lỗi; không hiển thị dữ liệu khách sai quyền; test trạng thái OFF bắt buộc.  
**Phối hợp / phụ thuộc:** Trung kiểm nguồn dữ liệu/rights; Hoàng API; Quân E2E.  
**Bằng chứng / bàn giao:** Flag matrix + safe fallback evidence  

### TL-01 — Integration, architecture và review PR [P0; checkpoint chính 20/11]

**Thực hiện:** Chốt hợp đồng dữ liệu frontend–backend, các chính sách OPEN theo người có quyền quyết định; review PR của nhóm, tránh merge nhánh diverged toàn bộ; giải quyết bug blocker và cập nhật mapping UI→API→FR; tích hợp lên main qua CI.  
**Điều kiện Done:** Mỗi PR có owner/reviewer/test/evidence; không có conflict/chênh lệch hợp đồng chưa ghi; backlog P0 rõ trạng thái cuối tuần.  
**Phối hợp / phụ thuộc:** Tất cả thành viên; Quân quản lý RTM, Thắng CI.  
**Bằng chứng / bàn giao:** Integration log + Architecture delta + release-candidate SHA  

## 3.2. Thắng — DevOps · Cloud · CI/CD & Test Automation Infrastructure

**Mục tiêu cá nhân:** Sở hữu môi trường chạy, luồng thực thi test tự động và kiểm tra release pipeline; không chịu trách nhiệm viết mọi test nghiệp vụ.

**Bàn giao chính:** CI PR checks, isolated services, Playwright CI prototype, Docker smoke, audit triage, AWS read-only readiness & cost plan.

### OPS-01 — Môi trường local/CI lặp lại được [P0; checkpoint chính 18/11]

**Thực hiện:** Đóng băng Node/npm versions; kiểm Docker Compose, PostgreSQL, Redis, backend API/admin/worker, storefront và fixture tối thiểu; env template không chứa secrets; tách local disposable DB với dữ liệu AWS.  
**Điều kiện Done:** Từ checkout sạch có thể `npm ci`, cấu hình, migrate và chạy health; tài liệu làm rõ cách start/stop, cleanup đúng DB test.  
**Phối hợp / phụ thuộc:** Trung dữ liệu mẫu, Hoàng cấu hình Medusa.  
**Bằng chứng / bàn giao:** Environment README + start/stop transcript  

### OPS-02 — CI gates: lint, unit, HTTP, build, IaC [P0; checkpoint chính 20/11]

**Thực hiện:** Rà `.github/workflows/ci.yml`, `api-tests.yml`: docs-check, format, typecheck, lint, Jest unit, HTTP integration với Postgres, Docker build, CloudFormation lint/Guard. Thêm/điều chỉnh điều kiện fail và lưu JUnit/log artifacts cho SHA; chạy Redis/worker smoke riêng nếu cần. **Đưa suite Staff/Admin role-negative của Quân/Hoàng vào CI** trên fixture tách biệt, kiểm tra test cấm trả 401/403; CI job đỏ nếu quyền sai. Không đưa license/secrets vào artifact.  
**Điều kiện Done:** PR có trạng thái checks rõ PASS/FAIL; job lỗi thật chặn merge theo quy tắc bảo vệ branch; CI/HTTP không bỏ qua P0.  
**Phối hợp / phụ thuộc:** Hoàng và Quân cung cấp suites/test commands.  
**Bằng chứng / bàn giao:** CI PR + check matrix + sample failed/passed run  

### OPS-03 — Đưa Playwright vào CI một cách ổn định [P0; checkpoint chính 20/11]

**Thực hiện:** Tạo job cài Chromium, chạy storefront với backend/DB/fixture cô lập, webServer readiness, `npm run test:e2e`, lưu HTML report, screenshot, trace/video khi thất bại. Giới hạn test data và cleanup, không dùng DB dùng chung.  
**Điều kiện Done:** Playwright chạy tự động trên PR hoặc workflow bắt buộc theo policy; test có thể chạy lại cùng commit/config; thất bại làm job đỏ.  
**Phối hợp / phụ thuộc:** Quân sở hữu nội dung Playwright, Quý sửa UI và selector.  
**Bằng chứng / bàn giao:** Playwright workflow + artifacts + run links  

### OPS-04 — Container build và deployment smoke contract [P0; checkpoint chính 20/11]

**Thực hiện:** Kiểm Docker image backend/storefront, worker tách route API, health/readiness, cấu hình biến build, catalog/media smoke; xây script `smoke` không đổi dữ liệu hoặc chỉ ghi vào fixture test được cho phép. Chốt các bước migration trước traffic và dùng digest bất biến.  
**Điều kiện Done:** Build sạch và kiểm API/UI/worker trên môi trường thử; có script exit khác 0 khi sai, log gọn và không rò secret.  
**Phối hợp / phụ thuộc:** Hoàng và Quý định nghĩa endpoints; Quân xác nhận assertions.  
**Bằng chứng / bàn giao:** Docker smoke checklist + build trace  

### OPS-05 — Triage dependency security, pipeline policy [P0; checkpoint chính 18/11]

**Thực hiện:** Chạy lại `npm audit --omit=dev` cho SHA hiện tại; ghi severity, dependency chain, reachability, owner và hướng fix. Đánh giá `continue-on-error: true` ở CI, đề xuất blocker đúng risk, không tắt kiểm tra hay dùng `audit fix --force`.  
**Điều kiện Done:** Mỗi high/critical có disposition và owner; không tuyên bố “security pass” nếu còn high liên quan runtime chưa xử lý hoặc được phê duyệt rõ.  
**Phối hợp / phụ thuộc:** Hoàng review Medusa upgrades, Quý review Next/Frontend risk.  
**Bằng chứng / bàn giao:** Security triage matrix + gate decision  

### OPS-06 — AWS readiness, chi phí và kế hoạch phát hành [P1; checkpoint chính 22/11]

**Thực hiện:** Chỉ kiểm kê read-only trạng thái ECS/RDS/Redis/ALB/S3/DNS/cert/CloudWatch và lease/budget nếu có quyền; rà CloudFormation change set, role OIDC, previous digests, backups/rollback strategy. Không tự start/update tài nguyên tốn phí hay thay dữ liệu.  
**Điều kiện Done:** Có checklist môi trường, yêu cầu phê duyệt, chi phí ước lượng/giờ và đường quay lại cho Tuần 2; mọi runtime “unknown” ghi NOT VERIFIED.  
**Phối hợp / phụ thuộc:** Quý phê duyệt kế hoạch và ngân sách; Trung DB migration/backup.  
**Bằng chứng / bàn giao:** AWS readiness inventory + cost/lease proposal  

### OPS-07 — Observability và evidence CI [P1; checkpoint chính 22/11]

**Thực hiện:** Rà logs và correlation ID cho request/worker; xác định dashboard metrics health, queue, notification, error rate; thiết kế phép thử nhận alert và lưu artifact theo run-id. Chuẩn bị k6 load workloads cho Tuần 2; chưa công bố p95 cloud chưa đo.  
**Điều kiện Done:** Có log/evidence schema và kế hoạch fault/load drill; GitHub CI report lưu nguồn chạy/revision; không lộ PII/token.  
**Phối hợp / phụ thuộc:** Hoàng instrumentation, Quân evidence/k6, Trung DB metrics.  
**Bằng chứng / bàn giao:** Observability checklist + NFR execution plan  

## 3.3. Hoàng — Backend Lead · Medusa Commerce · Business Logic

**Mục tiêu cá nhân:** Sở hữu API/workflows và tính đúng đắn giao dịch; tái sử dụng Medusa core, không xây một backend thương mại thứ hai.

**Bàn giao chính:** Auth/cart boundary tests, transaction correctness, notification service baseline, staff lifecycle contract, backend integration evidence.

### BE-01 — Auth/API boundary và cart integrity [P0; checkpoint chính 18/11]

**Thực hiện:** Rà native và legacy cart endpoints, xác thực customer/staff, ownership A/B, invalid/expired tokens, published/channel constraints, DTO projection; giữ guest cart semantics theo policy. Test cross-cart item deletion và invalid quantity.  
**Điều kiện Done:** API từ chối thao tác vượt quyền; không truyền `customer_id` từ client làm nguồn auth; native/legacy không có lỗ hổng khác biệt đã biết.  
**Phối hợp / phụ thuộc:** Quý account/cart UX, Quân negative tests.  
**Bằng chứng / bàn giao:** API boundary regression + evidence  

### BE-02 — Checkout/COD/Payment Simulator contract [P0; checkpoint chính 20/11]

**Thực hiện:** Kiểm luồng cart → address → shipping → COD/simulator non-prod → complete → Order. Phân biệt authorized/accepted với collected, error scenario/stock rollback, idempotent collection/session; áp validation server và log lỗi an toàn.  
**Điều kiện Done:** Payment fail không tạo order hợp lệ ngoài ý muốn/không báo đã thu; success có 1 order & correct totals, fulfillment chưa có không được tự đánh dấu shipped.  
**Phối hợp / phụ thuộc:** Trung fixture và readback; Quý UI; Quân assertions.  
**Bằng chứng / bàn giao:** Checkout integration tests + payment-state ADR  

### BE-03 — Duplicate/retry/timeout và tranh chấp tồn [P0; checkpoint chính 22/11]

**Thực hiện:** Dựng tests cùng một intent complete 2 lần đồng thời, timeout sau commit, payload khác nhau; 20 concurrent attempts cho 5 đơn vị tồn cuối trên DB disposable. Chỉ thêm extension workflow/idempotency khi Medusa core chưa đáp ứng, không SQL ghi trực tiếp.  
**Điều kiện Done:** Không có hai Order/Payment effects cho cùng intent; số đơn được chấp nhận không vượt tồn và reservation khớp; fail phân loại rõ, không chỉ kiểm HTTP status.  
**Phối hợp / phụ thuộc:** Trung snapshot DB, Quân chạy độc lập, Quý chặn double-submit UI.  
**Bằng chứng / bàn giao:** Concurrency test suite + reconciliation CSV/JSON  

### BE-04 — Customer notifications async + retry/dedupe [P0; checkpoint chính 22/11]

**Thực hiện:** Chốt mốc sự kiện theo quyết định nghiệp vụ. Thiết kế Medusa subscriber/notification provider sandbox, lưu outcome theo event/idempotency key, retry hữu hạn, xử lý duplicate/out-of-order, không làm rollback order/fulfillment nếu email lỗi.  
**Điều kiện Done:** Tạo đơn → notification record → sandbox delivery; provider down/recover có attempt log, capped retry và non-duplicate theo event logic; error cuối quan sát được.  
**Phối hợp / phụ thuộc:** Thắng Redis/worker runtime, Quân fault tests, Quý UI trạng thái.  
**Bằng chứng / bàn giao:** Subscriber/provider + integration tests + event flow diagram  

### BE-05 — Staff/Admin lifecycle, fulfillment, tracking và COD [P0; checkpoint chính 22/11]

**Thực hiện:** Dùng Medusa Admin mặc định: invite/login staff; kiểm products/stock/orders; chạy nghiệp vụ nhập tồn → publish → order → fulfillment/tracking thủ công → cập nhật status/COD. Chốt các trạng thái an toàn, không bịa vận chuyển thật. **Việc triển khai/cấu hình quyền Staff khác Admin tách thành BE-08**; không coi một user nội bộ đăng nhập `/app` là đã được phân quyền.  
**Điều kiện Done:** Một walkthrough end-to-end có ID đơn, actors, states và audit trail; staff trái quyền bị từ chối; customer thấy trạng thái đúng.  
**Phối hợp / phụ thuộc:** Trung data checks, Quân kiểm chứng Staff/role, Quý hiển thị trạng thái.  
**Bằng chứng / bàn giao:** Staff walkthrough + permission matrix + status contract  

### BE-06 — Reporting API tối thiểu và contract [P1; checkpoint chính 22/11]

**Thực hiện:** Rà khả năng Admin mặc định; chỉ thêm aggregate/read-only endpoint nếu cần cho 9th use case. Tổng số/giá trị đơn theo kỳ/trạng thái, stock thấp; phân biệt order value và COD collected. Bảo vệ quyền Staff/Admin.  
**Điều kiện Done:** Số liệu trả về đối soát được với fixture của Trung, phân quyền đúng, không cần viết dashboard mới nếu Medusa đã đáp ứng.  
**Phối hợp / phụ thuộc:** Trung sở hữu định nghĩa data/SQL read-only, Quân report tests.  
**Bằng chứng / bàn giao:** Minimal reporting contract + endpoint tests (if needed)  

### BE-07 — Backend test, docs và code review [P0; checkpoint chính 22/11]

**Thực hiện:** Mỗi PR backend có unit/HTTP tests success-failure, auth negative, simulator nonprod, worker error; cập nhật API/error response, ADR idempotency và notification; xác minh migrations modules/DTO và giữ code Medusa extension points chuẩn.  
**Điều kiện Done:** Lint/typecheck/unit/HTTP trên PR pass hoặc blocker ghi rõ; mọi thay đổi có code→test→requirement mapping và rollback/compatibility note.  
**Phối hợp / phụ thuộc:** Thắng CI, Quân RTM, Trung DB.  
**Bằng chứng / bàn giao:** Backend test evidence + API/ADR docs  

### BE-08 — Phân quyền Staff / Admin thực tế (RBAC) [P0; checkpoint chính 20/11]

**Hiện trạng / nguyên tắc:** SRS đã tách `ACT-CUST`, `ACT-STAFF`, `ACT-ADMIN` và có ma trận quyền **Draft**. Code hiện tại dùng Medusa `customer` cho Store API và `user` cho Medusa Admin; chưa thấy module RBAC được đăng ký trong `apps/backend/medusa-config.ts`, chưa có bằng chứng hai nhóm `Staff`/`Admin` có quyền tách biệt. Medusa Admin là UI có sẵn, **không đồng nghĩa Staff đã được giới hạn quyền**.

**Thực hiện:** (1) Đối chiếu PERM-001..005, FR-AUTH-04, FR-ORD-03, FR-ADM-01/02 và OPEN-USR-003/004/011; Quý/chủ chính sách chốt bảng quyền cần cho MVP. (2) Xác minh dự án có license hợp lệ cho Medusa Enterprise RBAC hay không; không ghi/commit license key. (3) **Nếu có license:** đề xuất đăng ký module RBAC trong Medusa 2.21.2, kiểm tra migration trên DB disposable, tạo role/policy, gán đúng người; **cảnh báo:** khi bật RBAC, admin hiện hữu và user tạo qua CLI có thể nhận Super Admin theo cơ chế bootstrap, phải kiểm tra rồi thu hồi quyền dư cho tài khoản Staff. (4) **Nếu không có license:** ghi ADR/gap; xây ranh giới Staff được bảo vệ ở server với các endpoint/đường vào hạn chế, hoặc giữ Staff ở trạng thái BLOCKED. **Không** cấp quyền vào toàn bộ `/app`/Admin API mặc định rồi chỉ ẩn menu; không quảng cáo đã có phân quyền.

**Ma trận tối thiểu cần chứng minh:** `Customer` chỉ truy cập tài nguyên của mình; `Staff` chỉ xem/xử lý đơn/tồn kho được giao theo policy, không mời/quản lý user, không cấu hình quyền hay xuất dữ liệu ngoài phạm vi; `Admin` thực hiện các hành động được duyệt. Chốt cụ thể từng quyền theo ma trận chính thức, không tự suy ra từ tên vai trò.

**Điều kiện Done:** Có bảng role × resource × action được duyệt; ít nhất 3 tài khoản kiểm thử tách biệt (Customer/Staff/Admin), test cả **ALLOW và DENY tại server API** (401/403 thích hợp), kiểm tra giao diện `/app` tương ứng; Staff gọi trực tiếp API cấm vẫn bị từ chối; log/trace và version/commit được lưu. Nếu thiếu license, policy hoặc không thể bảo vệ Admin API thì task ghi `BLOCKED`, không tự đánh PASS.

**Phối hợp / phụ thuộc:** Quý duyệt phạm vi và quyết định chính sách; Quân xây authorization test matrix / AT-10 và test độc lập; Thắng tích hợp tests vào CI; Trung cung cấp dữ liệu kiểm thử độc lập. Không yêu cầu Quý xây dashboard Staff riêng khi UI Medusa đáp ứng.

**Bằng chứng / bàn giao:** Permission Matrix v1 + License/Feasibility Decision + ADR đường triển khai + PR cấu hình/guard (nếu được phép) + Role-negative HTTP/Browser Test Report + CI artifact.

**Checkpoint phối hợp (BE-08 có checkpoint chính 20/11):** **18/11** chốt ma trận quyền và tính khả dụng license; **20/11** kiểm tra cấu hình/guard trên DB test và thử quyền dương/âm; **22/11** nghiệm thu Staff/Admin riêng hoặc nêu blocker P0 rõ ràng.

**Tài liệu Medusa:** https://docs.medusajs.com/resources/enterprise/rbac · https://docs.medusajs.com/resources/enterprise/rbac/concepts · https://docs.medusajs.com/user-guide/settings/roles

## 3.4. Trung — Data Engineer · PostgreSQL · Data Quality & Reporting Data

**Mục tiêu cá nhân:** Chịu trách nhiệm chất lượng, hợp đồng và bằng chứng dữ liệu. Không sở hữu code Medusa Admin UI hoặc business workflow fulfillment.

**Bàn giao chính:** Schema/ERD map, DAYMARK fixture verification, reconciliation queries/reports, report dataset, migration safety notes.

### DATA-01 — Database baseline, ERD và Data Dictionary [P0; checkpoint chính 18/11]

**Thực hiện:** Đọc schema/migrations Medusa và module reco/personalization; ánh xạ Customer, Product, Variant, Price, Cart, Order, Payment, Inventory, Fulfillment, Notification target. Chốt owner dữ liệu và đâu là source of truth; không thay schema core bằng SQL tùy ý.  
**Điều kiện Done:** ERD/Dictionary nêu đúng quan hệ/ID/đơn vị tiền/trạng thái/ownership; ghi rõ bảng/noti mới chưa triển khai nếu chưa có.  
**Phối hợp / phụ thuộc:** Hoàng xác nhận workflow; Quân RTM; Thắng test database.  
**Bằng chứng / bàn giao:** ERD v3 + data inventory + gap list  

### DATA-02 — DAYMARK catalog, seed/import và media checks [P0; checkpoint chính 18/11]

**Thực hiện:** Trên PostgreSQL dùng riêng: `seed-commerce`/DAYMARK importer theo runbook, dry-run/apply/rerun guard. Đối soát 30 products/230 SKU/3 collections/6 categories/2.554 units initial fixture; ảnh 30 + 4 editorial; thử duplicate SKU, owner conflict, broken media; không seed lại DB AWS.  
**Điều kiện Done:** Data counts/identifiers/price VND/media đúng theo fixture; rerun không duplicate hoặc reset stock; mọi mismatch có report và bước khắc phục.  
**Phối hợp / phụ thuộc:** Quý/Quân dùng seed test, Hoàng xác nhận Medusa workflow.  
**Bằng chứng / bàn giao:** Seed validation report + fixture manifest + logs  

### DATA-03 — Order–Payment–Inventory reconciliation [P0; checkpoint chính 20/11]

**Thực hiện:** Chuẩn bị snapshot/readback qua API, query an toàn read-only hoặc report test fixture: stock before/after, reserved, order ID, payment collection/session, cancel/fulfillment. Cùng Hoàng chạy last-unit contention 20/5 và retry cases.  
**Điều kiện Done:** Có bảng expected/actual cho success/failure/cancel/concurrent; không oversell hoặc duplicate effect được xác nhận bằng dữ liệu, không chỉ response HTTP.  
**Phối hợp / phụ thuộc:** Hoàng test logic, Quân độc lập nghiệm thu.  
**Bằng chứng / bàn giao:** Reconciliation scripts/reports + anomaly log  

### DATA-04 — Reporting data definitions và fixtures [P1; checkpoint chính 20/11]

**Thực hiện:** Chốt đơn theo trạng thái, giá trị VND, thời gian, stock thấp, COD chưa/đã thu; soạn aggregation read-only và fixture đối soát. Không gọi giá trị đơn là doanh thu hoặc tiền thu thực tế.  
**Điều kiện Done:** Mỗi chỉ số có công thức/nguồn/time zone, kết quả fixture expected; Hoàng có contract để sử dụng trong Admin/report API.  
**Phối hợp / phụ thuộc:** Hoàng reporting API, Quân test report totals.  
**Bằng chứng / bàn giao:** Reporting data dictionary + expected dataset  

### DATA-05 — Migration, index và dữ liệu cloud an toàn [P1; checkpoint chính 22/11]

**Thực hiện:** Lập danh sách migration pending, backward-compatibility, backup/readback và rollback giới hạn; kiểm EXPLAIN cho sort/catalog trên 120 sản phẩm tổng hợp và điểm nghẽn DB ở mức local. Không thực hiện restore trên DB dùng chung.  
**Điều kiện Done:** Có migration plan không phá dữ liệu, đề xuất index chỉ khi có số đo; rollback DB không tự động; AWS data verification nằm ở tuần sau.  
**Phối hợp / phụ thuộc:** Thắng release/migration, Quý query UX, Hoàng Medusa modules.  
**Bằng chứng / bàn giao:** DB readiness + migration plan + local query report  

### DATA-06 — Recommendation source/consent guardrails [P2; checkpoint chính 22/11]

**Thực hiện:** Kiểm provenance DAYMARK vs H&M, quyền ảnh và version, consent/epoch/profile retention; không import bộ nghiên cứu có giới hạn lên public, không làm lại pipeline mới trong tuần này.  
**Điều kiện Done:** Flag/data checklist nêu rõ phần cho phép và chưa cho phép; khi thiếu bằng chứng giữ personalization OFF.  
**Phối hợp / phụ thuộc:** Hoàng recommendation APIs, Quý fallback UI, Quân feature flag tests.  
**Bằng chứng / bàn giao:** Dataset rights & feature-gate register  

## 3.5. Quân — QA Lead · Automation Testing · Documentation & Acceptance

**Mục tiêu cá nhân:** Chịu trách nhiệm đặc tả test, thực thi và báo cáo nghiệm thu độc lập; không thực hiện phát triển tính năng frontend.

**Bàn giao chính:** Requirement–test matrix, Playwright suites, negative tests, bug triage, evidence index, Week1 acceptance report.

### QA-01 — RTM, test plan và tiêu chí chấp nhận [P0; checkpoint chính 18/11]

**Thực hiện:** Ánh xạ 9 nhóm nghiệp vụ FR/UC/AT → owner code → test ID → expected actual → evidence. Liệt kê ca dương/âm, authz A/B, simulator error, double complete, last stock, status/email fail. Chốt trạng thái `PASS/FAIL/BLOCKED/NOT RUN`.  
**Điều kiện Done:** 100% các yêu cầu MUST có test case & owner, các policy OPEN ghi người quyết định; không tự đánh PASS trước khi chạy.  
**Phối hợp / phụ thuộc:** Quý quyết định scope, Hoàng/Trung expected business/data.  
**Bằng chứng / bàn giao:** QA Plan + RTM + acceptance matrix  

### QA-02 — Test fixture/automation harness dùng riêng [P0; checkpoint chính 18/11]

**Thực hiện:** Rà suites Jest/HTTP và Playwright hiện hữu, tránh merge nhánh diverged nguyên lịch sử; dùng DB disposable/seed có checksum/IDs, tài khoản test riêng, locale `/vn`, Chromium. Chuẩn bị browser report/screenshot/trace.  
**Điều kiện Done:** Test chạy lặp lại không ảnh hưởng DB dùng chung; dữ liệu test reset và test ID riêng; hướng dẫn run local ngắn.  
**Phối hợp / phụ thuộc:** Trung fixture, Thắng CI env, Hoàng backend seed.  
**Bằng chứng / bàn giao:** Test harness + fixture guide  

### QA-03 — Playwright E2E toàn bộ customer journey [P0; checkpoint chính 20/11]

**Thực hiện:** Viết/sửa tests Home, Catalog/Search, PDP variants, Auth/Account, Cart, Checkout COD, Order Confirmation/History/Tracking và mobile. Kiểm payment fail, loading/empty/error, keyboard/focus; dùng selector ổn định, không sửa logic UI thay Quý.  
**Điều kiện Done:** Các flow trọng yếu pass hoặc có blocker tái hiện rõ; evidence gắn SHA; thất bại lưu trace/screenshot.  
**Phối hợp / phụ thuộc:** Quý sửa UI; Thắng tích hợp CI.  
**Bằng chứng / bàn giao:** Playwright suite + HTML report + defects  

### QA-04 — API/security/transaction negative testing [P0; checkpoint chính 20/11]

**Thực hiện:** Chạy với Hoàng/Trung HTTP scenarios login bad token, A/B order, cross-cart, invalid qty, simulator fail, retry/timeout, simultaneous completion, last-unit. **Bổ sung AT-10:** đăng nhập Customer/Staff/Admin bằng tài khoản test tách biệt; kiểm Staff không thể mời/quản lý user, sửa role, hoặc gọi API ngoài nhiệm vụ qua request trực tiếp; Admin và Staff hợp lệ chỉ được quyền đã chốt; kiểm tra 401/403 và không rò dữ liệu. Xác nhận trạng thái DB và payment/stock, không chỉ status code.  
**Điều kiện Done:** P0 transaction/authz có expected/actual/readback; khi fail ghi BUG-P0 và chặn nghiệm thu.  
**Phối hợp / phụ thuộc:** Hoàng code fixes, Trung reconciliation, Thắng CI.  
**Bằng chứng / bàn giao:** Negative API matrix + concurrency evidence  

### QA-05 — Notification và Staff/Admin acceptance [P0; checkpoint chính 22/11]

**Thực hiện:** Kiểm event duplicate/out-of-order, sandbox inbox, provider fail/recover, bounded retries; Staff invite/login, nhận hàng, publish, fulfillment, tracking, COD, RBAC và report totals. **Role acceptance:** đối chiếu permission matrix đã chốt với quyền tại API và `/app`; test DENY bằng lời gọi trực tiếp, kiểm Super Admin có bị gán nhầm cho Staff hay không; nếu chưa triển khai RBAC an toàn thì đánh BLOCKED.  
**Điều kiện Done:** Có witnessed walkthrough/recording và outcome theo AT-05/17/18; lỗi email không thay đổi đơn; không coi bản mock UI là chứng cứ chức năng.  
**Phối hợp / phụ thuộc:** Hoàng flow, Trung counts, Thắng worker runtime.  
**Bằng chứng / bàn giao:** Staff+Notification acceptance logs + screenshots  

### QA-06 — Bug triage, CI evidence và regression [P0; checkpoint chính 22/11]

**Thực hiện:** Mỗi bug có severity, precondition, version, steps, expected/actual, screenshot/trace và owner. Duy trì regression theo lần merge, kiểm CI latest SHA, test flakiness; chỉ xác nhận FIXED khi chạy lại.  
**Điều kiện Done:** Không có bug P0 bị đóng thiếu test; status định nghĩa rõ; QA dashboard cập nhật vào các mốc 18/20/22 và ngay khi có blocker P0.  
**Phối hợp / phụ thuộc:** Tất cả owner; Thắng test artifacts.  
**Bằng chứng / bàn giao:** Defect tracker + báo cáo QA tại các checkpoint 18/20/22  

### QA-07 — Docs/test report và Week1 exit review [P0; checkpoint chính 22/11]

**Thực hiện:** Cập nhật SRS→RTM, API/use-case notes, risk register, open decisions, release candidate evidence index; soạn Week1 test summary và known limitations; tách local evidence với cloud historical.  
**Điều kiện Done:** Báo cáo cuối tuần chỉ ra PASS/FAIL/BLOCKED/NOT RUN theo SHA, quyết định feature complete hoặc carry-over tuần 2; tất cả P0 có owner và ngày xử lý.  
**Phối hợp / phụ thuộc:** Quý ký review, Thắng CI run info.  
**Bằng chứng / bàn giao:** Week1 QA Report + RTM + evidence index + blockers  

# 4. Ma trận tích hợp và trách nhiệm xuyên chức năng

Một use case chỉ được đánh dấu hoàn thiện khi cả UI/API/data/test (và CI khi liên quan) có bằng chứng. Các mã dưới đây là mã mapping nghiệp vụ trong repo; khi phát hiện luật OPEN, cần chốt decision log trước khi assert điều kiện đúng.

| FR | Chức năng | Quý / UI | Hoàng / Backend | Trung / Data | Quân / QA | Thắng / CI |
| --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Auth/Register/Login/Profile | FE-03 | BE-01 | DATA-01 | QA-01/03/04 | OPS-02/03 |
| FR-02 | Catalog/Search/Variants | FE-02 | BE-01 | DATA-02/05 | QA-03 | OPS-03 |
| FR-03 | Cart | FE-04 | BE-01 | DATA-03 | QA-03/04 | OPS-03 |
| FR-04 | Checkout/Order | FE-04/05 | BE-02/03 | DATA-03 | QA-03/04 | OPS-03/04 |
| FR-05 | Payment COD/Simulator | FE-04 | BE-02/03 | DATA-03 | QA-04 | OPS-02 |
| FR-06 | Inventory | FE-02/04 | BE-03/05 | DATA-03 | QA-04 | OPS-02 |
| FR-07 | Order Tracking | FE-05 | BE-05 | DATA-03 | QA-03/05 | OPS-03 |
| FR-08 | Notifications | FE-05 (state) | BE-04 | DATA-01 | QA-05 | OPS-04/07 |
| FR-09 | Admin/Reporting + Staff/Admin RBAC | Không làm Admin UI mới | BE-05/06/**08** | DATA-04 | QA-04/05 | OPS-02/04 |

## 4.1. Phụ thuộc quan trọng

- Quý + Quân chốt route selectors/testIDs → Thắng triển khai Playwright CI. Tests do Quân viết, Thắng chịu trách nhiệm pipeline và môi trường.
- Quý/Hoàng chốt request/response và trạng thái COD/fulfillment → Quân viết expected states → Trung đối soát DB; tránh sửa UI dựa trên suy đoán.
- Trung chuẩn bị fixture/readback → Hoàng chạy concurrency/retry tests → Quân nghiệm thu độc lập; có duplicate/oversell là P0.
- Hoàng có event/subscriber sandbox → Thắng có worker/runtime logs → Quân fault test và lưu evidence; email failure không rollback order.
- Thắng kiểm kê AWS read-only và budget → Quý duyệt kế hoạch chi tiêu → Tuần 2 mới quyết định staging/release; không tự apply CloudFormation Tuần 1.

# 5. Kế hoạch kiểm thử Tuần 1 và bằng chứng tối thiểu

| Test ID / mức | Luồng / dữ liệu | Expected / bằng chứng |
| --- | --- | --- |
| AT-01 / P0 | Đặt COD, checkout, confirmation, Order readback | Một Order ID đúng items/tổng tiền; stock reserved hợp lệ; screenshots + API/DB record. |
| AT-02,14 / P0 | Simulator non-prod success/failure | Failure không báo success/không có order ngoài ý muốn; snapshot stock/collection. |
| AT-03 / P0 | Double click, 2 requests, timeout/retry | Một intent không tạo hai hiệu ứng; readback Order/Payment/Stock; case payload khác phân loại. |
| AT-15 / P0 | 20 attempts / 5 cuối cùng | Không oversell, không reservation âm/ngoài ý muốn; fixture disposable. |
| AT-04,09,10 / P0 | Customer A/B; Staff/Admin role matrix; direct Admin API; user management | API cho phép đúng quyền và từ chối trái quyền (401/403); Staff không quản lý user/role; không lộ dữ liệu riêng; kiểm Super Admin bootstrap. |
| AT-11,12 / P0 | Search/filter/sort, variants, cart invalid | Catalog published/region đúng; >100 sản phẩm sort có kiểm; giỏ nguyên vẹn. |
| AT-05 / P0 | Event notification fail/duplicate/retry | Order bền; gửi qua sandbox; retry có hạn, dedupe và trạng thái cuối quan sát. |
| AT-17,18 / P0 | Staff: stock→publish→fulfillment→COD/report | Walkthrough + data reconciliation, role negative tests, không nhầm COD thu thật. |
| CI-01 / P0 | Lint/typecheck/unit/HTTP/build/Playwright | Test có artifact trên cùng SHA; lỗi làm check đỏ; screenshot/trace khi browser fail. |
| UI-01 / P0 | Mobile 375, tablet 768, desktop 1440 | Header, forms, cart, checkout, gallery dùng được; không hydration/blocker. |

## 5.1. Cấu trúc evidence và báo cáo kiểm thử

Khuyến nghị evidence folder theo `docs/report/evidence/2026-11-22-w1-<run-id>/` hoặc một đường dẫn báo cáo ổn định trong repo. Mỗi trường hợp phải ghi commit SHA, branch, môi trường, dependency versions, seed/fixture version, test command, timestamp, expected/actual, verdict, link raw log/trace/screenshot và chủ review. **Không** đưa secrets, access token hoặc PII thật vào artifact.

## 5.2. Lệnh smoke tham khảo

- `npm ci`
- `npm run lint --workspace=@dtc/storefront`
- `npm run typecheck --workspace=@dtc/storefront`
- `npm run test:unit --workspace=@dtc/backend`
- `npm run test:integration:http --workspace=@dtc/backend`
- `npm run test:e2e --workspace=@dtc/storefront`
- `npm run docs:check`

**Lưu ý:** HTTP, Playwright và tests liên quan Medusa cần PostgreSQL/Redis/backend/seed phù hợp; chạy lệnh trên môi trường chưa chuẩn bị không chứng minh phần mềm lỗi. Thắng và Quân ghi rõ cách dựng fixture và cấu hình.

# 6. Exit checklist ngày 22/11 — Feature Complete / Carry-over

- [ ] 9/9 nhóm nghiệp vụ có owner và status VERIFIED/PARTIAL/BLOCKED; không có FR bắt buộc “mất” khỏi RTM.
- [ ] Customer flows: browse → PDP → cart → address/shipping → COD → order confirmation/history được kiểm thử trên RC1.
- [ ] Checkout retry, payment failure và last-unit contention được thử trên database disposable với readback dữ liệu.
- [ ] Staff/Admin có ma trận quyền duyệt, 3 tài khoản test riêng, server-side allow/deny và `/app` role acceptance; **thiếu RBAC/license hoặc bảo vệ API thì ghi P0 BLOCKED**, không cấp Staff toàn quyền. Notification có walkthrough/integration evidence hoặc P0 blocker.
- [ ] Frontend responsive/empty/error/keyboard và recommendation OFF/fail không chặn checkout.
- [ ] CI lint/typecheck/unit/HTTP/build có logs; Playwright pipeline hoạt động hoặc có blocker rõ, không ghi “đã có” như “pass”.
- [ ] Security audit được chạy lại; 23 high snapshot cũ được triage; không tuyên bố production-ready khi unresolved high/runtime.
- [ ] Data importer rerun không duplicate/reset stock; fixture version/ERD/data ownership và reporting definitions được lưu.
- [ ] Tất cả P0 bug có status và owner; feature freeze và RC1 SHA được ghi; tài liệu không mô tả PR #14 còn draft như trạng thái hiện tại.
- [ ] AWS chỉ kiểm kê/read-only theo quyền; kế hoạch staging Tuần 2 có approval/budget/rollback và không có thay đổi dữ liệu ngoài phạm vi.

**Định nghĩa quyết định:** `FEATURE COMPLETE (có điều kiện)` khi các luồng P0 có code và smoke trên RC1, các điểm còn lại có owner/risk; `PARTIAL` khi còn P0 chưa triển khai hoặc test chưa chạy; `BLOCKED` khi lỗi mất/trùng đơn, oversell, quyền truy cập, notification phá order hoặc môi trường test không đủ. Không đồng nhất kết quả Tuần 1 với GO phát hành AWS cuối cùng.

# 7. Rủi ro, quyết định và xử lý blocker

| ID | Mức | Rủi ro / blocker | Hành động giảm thiểu / owner |
| --- | --- | --- | --- |
| W1-R1 | P0 | Thay đổi 9 nghiệp vụ quá nhiều trong 7 ngày | Tái sử dụng Medusa + UI đã merge; ưu tiên checkout/stock/auth; không làm AI/dashboard mới.  /  Owner: Quý / Hoàng |
| W1-R2 | P0 | Chính sách guest/fulfillment/notification chưa được duyệt | Quý lập decision log trước checkpoint 18/11; case chưa duyệt gắn BLOCKED, không suy policy từ code.  /  Owner: Quý / Quân |
| W1-R3 | P0 | Duplicate checkout và last-unit oversell | BE-03 + DATA-03 + QA-04 phải có DB readback; không chốt bằng HTTP 200.  /  Owner: Hoàng / Trung / Quân |
| W1-R4 | P0 | Notification thiếu provider/subscriber | Sandbox adapter, retry/dedupe, fail-open với order; chưa chọn external provider mới khi thiếu phê duyệt.  /  Owner: Hoàng / Thắng |
| W1-R5 | P0 | Playwright flaky/khó tạo fixture | Dùng disposable DB, seed version, workers=1, trace; tách lỗi môi trường khỏi bug app.  /  Owner: Quân / Thắng |
| W1-R6 | P0 | Audit 23 high theo snapshot lịch sử | Quét lại theo SHA, triage reachability, không bỏ qua gate hay ghi security PASS giả.  /  Owner: Thắng |
| W1-R7 | P1 | Quý quá tải frontend + Tech Lead | Giữ frontend core ưu tiên P0, giao QA hoàn toàn cho Quân; review PR theo 2 khung giờ.  /  Owner: Quý |
| W1-R8 | P1 | Tác động nhầm vào RDS/Redis/S3 AWS | Chỉ data test disposable; AWS inventory read-only, change set/chi phí cần phê duyệt.  /  Owner: Thắng / Trung |
| W1-R9 | **P0** | Staff được dùng Medusa Admin nhưng chưa có RBAC → có thể toàn quyền | BE-08 xác minh license và cấu hình/guard server-side; QA-04/05 thử DENY direct API; Thắng đưa vào CI. Nếu không bảo vệ được, khóa Staff và ghi BLOCKED.  /  Owner: Hoàng / Quân / Thắng |

## 7.1. Các quyết định cần chốt trước checkpoint 18/11

- Cho phép guest checkout và cơ chế guest tra cứu đơn; không mặc nhiên cho guest xem đơn qua ID không xác thực.
- Quyền Staff/Admin theo PERM-001..005; quyết định license Medusa Enterprise RBAC và phương án không-license (Staff API/surface hạn chế, không cho Staff dùng Admin full-access); khi nào nhập kho/cancel/fulfill và trạng thái nào công bố cho khách.
- Quy tắc COD: đơn nhận chưa phải đã thu, thời điểm ghi collected và cách báo cáo/đối soát.
- Thời điểm reservation/release stock, hành vi retry timeout/payload mismatch và lỗi upstream.
- Mốc cần gửi thông báo, kênh sandbox/email, trạng thái delivered/failed, retry cap và người xử lý lỗi cuối.
- Định nghĩa các chỉ số báo cáo theo thời gian và phạm vi dữ liệu/ảnh có quyền công bố.

# 8. Checklist giao nộp và mẫu cập nhật tại ba checkpoint

| Thành viên | Artifacts phải bàn giao tối 22/11 |
| --- | --- |
| Quý | Frontend PRs + route status + screenshots mobile/desktop + architecture/API changes + integration RC1 SHA. |
| Thắng | CI workflows + sample run links/artifacts + Docker smoke + audit triage + AWS/budget plan. |
| Hoàng | Backend PRs + HTTP/unit results + concurrency/notification evidence + staff/fulfillment contract + **BE-08 role policy/ADR/permission evidence**. |
| Trung | Data fixture report + ERD/data dictionary + stock/order/payment reconciliation + reporting dataset. |
| Quân | Test Plan/RTM + Playwright reports/traces + bug tracker + **Customer/Staff/Admin authorization matrix results** + Week1 QA acceptance + known limitations. |

**Mẫu cập nhật ở các mốc 18/20/22 (trước 21:00):** `Ngày checkpoint | Người | Task ID | Status (TODO/IN PROGRESS/PR/TESTED/BLOCKED/DONE) | PR/commit | Test & evidence | Blocker | Hành động tiếp theo/owner`. Với status DONE phải có reviewer xác nhận; dùng Not Run thay vì ghi “pass” nếu chưa chạy.

**Bàn giao sang Tuần 2 (23–29/11):** RC1 với danh sách P0 còn mở, bộ automated tests được cấu hình và báo cáo thật; tuần 2 tập trung full regression/security/k6/staging AWS khi có approval. Tuần 3 dành cho hardening, cloud release, verify và demo; không chuyển “chưa đạt” thành “đạt” chỉ vì đã tới deadline.

# 9. Nguồn baseline và tài liệu tham chiếu

- **Audit hiện trạng (16/11/2026):** DAYMARK_Project_Status_Assessment_2026-11-16.md (file Project)
- **Kế hoạch 7 ngày trước đó:** DAYMARK_7_Day_Completion_and_Cloud_Readiness_Plan_2026-11-16.md (file Project; phân vai cũ đã được cập nhật ở tài liệu này)
- **PR #14 — DAYMARK Storefront:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/14
- **PR #15 — Notification spec:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/15
- **SRS + traceability:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/03-requirements/SRS.md
- **Requirements mapping:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/technical/requirements-mapping.md
- **Design system:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/design-system/README.md
- **Testing / NFR:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/05-testing.md
- **Delivery gaps:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/spec/07-delivery.md
- **Staff/Admin actor và permission Draft:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/02-users/actors-and-user-goals.md
- **Medusa Enterprise RBAC:** https://docs.medusajs.com/resources/enterprise/rbac · https://docs.medusajs.com/resources/enterprise/rbac/concepts
- **CI pipeline:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/.github/workflows/ci.yml
- **Cloud operations:** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/RUNBOOK.md

**Giới hạn chứng cứ:** Kế hoạch xây trên audit source-based ngày 16/11, source/PR và tài liệu được đọc tại thời điểm đó. Không có bằng chứng chạy lại monorepo, CI, AWS runtime trong tài liệu này. Mọi acceptance là tiêu chí dự kiến; owner bổ sung kết quả thực tế theo từng run.
