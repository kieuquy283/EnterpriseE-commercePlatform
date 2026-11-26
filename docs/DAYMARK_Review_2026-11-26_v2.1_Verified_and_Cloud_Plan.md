# DAYMARK — Review hiện trạng & kế hoạch hoàn thành Cloud

**AUDIT V2.1 | 26/11/2026 | SOURCE + GITHUB ACTIONS VERIFIED**
Thời gian thực hiện: 26/11–06/12/2026; dự phòng 07–09/12 nếu được duyệt. Báo cáo thay thế v2.0-draft trước khi kết nối GitHub. Phạm vi: Customer / Staff / Admin, 9 nghiệp vụ, 36 task Tuần 1, cloud readiness.

## 1. Tóm tắt điều hành và quyết định release

**Verdict: PARTIAL / RELEASE BLOCKED.** Đã kiểm tra nhánh main trực tiếp, source ở SHA `d6790f137c4392b09e28b08bc52fbffe009d0718` (merge PR #22, 25/11 lúc 19:44 Việt Nam), PR #24 đang mở, báo cáo kỹ thuật có ngày và log Actions. So với audit 16/11 tại `084f229`, GitHub compare trả 56 commit ahead và 224 file thay đổi. Nền tảng khách hàng đã trưởng thành rõ rệt; không giao lại các tính năng đã chạy thành công. Chuyển trọng tâm sang Staff thực sự có quyền, notification end-to-end, reporting, security và cloud acceptance.

| Hạng mục | Kết quả đã xác minh / giới hạn |
|---|---|
| CI HEAD 25/11 [S2] | verify, documentation, cloudformation, browser-container PASS; security-policy FAIL. Release BLOCKED do finding chưa được phê duyệt. |
| Backend [S2, S3] | 158 unit PASS (18 suite); HTTP 40 PASS, 3 skip (9 suite pass, 1 skip); riêng load-failure-smoke job PASS. Không cộng hai lần chạy HTTP trùng. |
| Frontend [S2, S5] | Chromium 21 pass, 6 skip, 0 fail; customer ownership và COD đã có regression. 6 skip liên quan fixture H&M ở report RC1; chưa test Staff browser. |
| Staff/Admin [S7] | Đã có persisted marker và guard toàn Admin API, role-negative HTTP PASS. Staff bị khóa khỏi Admin API, chưa có thao tác Staff được phép theo assignment; RBAC đầy đủ chưa xong. |
| Notification [S8] | Có outbox/migration/subscriber/job/provider sandbox, unit/HTTP PASS. Chưa có bằng chứng gửi email thật hoặc status giao đủ điều kiện; cần sửa/kiểm claim lease, restart. |
| Data [S10] | DATA-01/02 đã merge; DATA-03/04 nằm ở PR #24, chưa merge, CI security FAIL dù API tests PASS. |
| AWS [S11, S12] | Preview 18/11 đã có catalog/HTTPS/Admin/COD. 21/11 đã stage digest qua ECR, Running=false; compute 0, RDS/Redis stopped ở lần inventory. Không xác nhận AWS live hôm nay. |

**Năm blocker phải đóng:** (1) dependency gate hiện đỏ; (2) Staff có thể làm việc được nhưng không vượt quyền; (3) lifecycle fulfillment/tracking/COD và reporting; (4) notification có giao nhận thực tế và xử lý restart/concurrency; (5) release mới đúng SHA trên AWS cùng performance, alert, recovery, budget. Không suy từ kết quả test local thành cloud PASS.

## 2. Căn cứ, giới hạn và thay đổi từ Tuần 1

Báo cáo đọc trực tiếp repo và Actions qua quyền GitHub; không checkout/chạy code, không truy cập AWS Console/RDS/Redis thực tế, không kiểm credentials, không tải ZIP artifacts để phân tích từng advisory. Số liệu log ghi đúng revision. Các báo cáo cũ được giữ nguyên verdict; khi mâu thuẫn, dùng code và log mới hơn để xác định lát cắt tương ứng. Không tuyên bố mọi task đã hoàn thành vì PR merge. Nhãn: PASS-SLICE = bằng chứng đạt một phạm vi; PARTIAL = đã làm nhưng thiếu acceptance; BLOCKED = cổng hoặc quyết định đang chặn; PR-OPEN = chưa tích hợp; NV = chưa có đủ bằng chứng; TARGET = mục tiêu cần đo.

| PR / mốc | Trạng thái trực tiếp | Ý nghĩa với tiến độ |
|---|---|---|
| #17 / #16, 18/11 | Merge frontend và backend | Cập nhật UI, cart/auth boundary; kiểm chứng preview và fixtures cùng giai đoạn |
| #19, 20/11 | Merge DATA-01/02 | ERD v3, catalog validation và import rerun guard |
| #20, 20/11 | Merge backend | Thêm evidence/test/contract checkpoint; đối chiếu source mới hơn nếu verdict cũ |
| #18, 21/11 | Merge Ops foundation | CI browser, audit blocking, Medusa 2.22.7, image Alpine/scan, guard Staff, logging/k6/cloud tooling |
| #21, 25/11 | Merge storefront RC1 | FE-05/06/07, ownership A/B, responsive, recommendation fallback, Playwright evidence |
| #22, 25/11 | Merge backend Tuần 1 | BE-03 concurrency, BE-04 outbox, BE-05/07 report; main HEAD audited |
| #23 / #24, 25/11 | #23 closed không merge; #24 open | DATA-03/04 rebase/conflict resolved, 10 file, 13 tests local PASS theo PR; chưa đưa vào main |

Stack hiện hành theo package/config [S4]: Medusa **2.22.7**, UI 4.2.14, Next.js 15.5.29 theo report dependency, Node 24.22.1, npm 11.12.1, TypeScript 6.0.3. PostgreSQL và Redis dùng cho commerce/cache/event/workflow/locking; Next storefront và Admin bundle; S3 media proxy; ECS Fargate API/Admin, worker, storefront. Một số tài liệu BE-05, RBAC, ERD vẫn ghi 2.21.2; cập nhật version và kiểm migration, không diễn giải chúng là code 2.22.7 đã nghiệm thu.

## 3. Review chín nghiệp vụ và phạm vi còn thiếu

Đối chiếu Project Topics trang 4–5, SRS main và FR-01..09 trong `docs/spec/01-business.md`. Mỗi hàng nêu lát cắt đạt và phần còn phải làm; cả chín UC phải nghiệm thu trên cùng RC/cloud.

| UC | Trạng thái và bằng chứng | Việc còn thiếu / owner chính |
|---|---|---|
| 01 Registration/Login | PASS-SLICE: customer register/login/error/ownership A/B; Admin 200, Staff guard 403, Customer Admin 401 qua CI | Staff positive authorization, profile/address regression và policy OPEN; Hoàng/Quý |
| 02 Catalog/Search | PASS-SLICE: 30 sản phẩm/230 SKU, VND, collection/PDP, media đã có local + AWS 18/11. Browser pass | Kiểm fixture ảnh trên RC mới, channel/region/search sort; S3/proxy readback cloud; Quý/Trung |
| 03 Shopping cart | PASS-SLICE: add/update/remove/empty, integer quantity và cross-cart guard native/legacy, channel auth | Regression edge cases và đồng bộ cart giữa guest/login theo policy; Quý/Hoàng |
| 04 Checkout/Order | PARTIAL: COD UI + API, duplicate same-cart và 20/5 test có evidence; replay cùng order | Real lost-response, khác payload/intent, multi-task Redis locking; quyết định guest/order transfer; Hoàng/Trung |
| 05 Payment | PARTIAL: COD/simulator success/fail; production config không đăng ký simulator; PR #24 có capture test | COD collection evidence và capture/refund contract, không coi authorize là collected; Hoàng/Trung |
| 06 Inventory | PASS-SLICE: duplicate/20 attempts-5 units PASS local, reconciliation 24/24 BE-05, AWS 18/11 giảm available 1 và trả khi cancel | Multi-task cloud contention, fulfilled/partial/cancel readback, merge DATA-03; Hoàng/Trung |
| 07 Order tracking | PARTIAL: FE history/detail/status Việt hóa, A/B isolation; order readback có | Staff assigned fulfillment, shipped/delivered/tracking và COD; customer thấy cập nhật đúng; Hoàng/Quý |
| 08 Notification | PARTIAL: outbox, order.placed/canceled, dedupe/retry/final failure qua HTTP | Provider giao nhận thật, event fulfillment/status được duyệt, worker E2E, claim atomic/restart và 95%/60s; Hoàng |
| 09 Admin/Reporting | BLOCKED/PARTIAL: Admin native, authz deny Staff, PR #24 report definitions/fixture | Staff restricted operations, report UI/export/API có quyền và reconciliation; Hoàng/Trung/Quý |

Recommendation là tính năng nâng cao; đã có OFF fallback E2E ở storefront. Không mở rộng personalization/AI trong hai tuần cuối. Nếu bật, test 404/500/timeout, dữ liệu/quyền sử dụng và latency riêng; nếu thiếu evidence giữ flag OFF.

## 4. Chi tiết Frontend và QA — Quý / Quân

FE-05/06/07 đã có evidence cục bộ trên commit `777f8c0`: 21 pass, 6 skip, 0 fail; production build, catalog/cart/COD/history, A/B, 375/768/1440px, reduced motion/keyboard/hydration, fallback OFF. Report 21/11 là PARTIAL, không phải biên bản 22/11; PR #21 hiện đã merge. HEAD CI browser-container xác nhận 21 pass/6 skip, container migrate/seed/smoke và Trivy gate đạt. Không yêu cầu xây lại UI. Kiểm lại các ca skip đúng phạm vi H&M; bổ sung test ảnh DAYMARK thực trên current fixture và cloud S3 (RC1 local import chọn images none). 404 UI khi stream có thể trả HTTP 200; nếu AT yêu cầu HTTP 404 thì kiểm riêng. Bảo đảm khách B không thấy order data, không chỉ ẩn UI.

**Còn lại:** kiểm tracking/fulfillment/payment state UI trên đơn thật fixture, account profile/address và guest policy; FE gọi API Staff mới chỉ sau khi contract được duyệt. Quý phụ trách toàn bộ frontend, có thể tái sử dụng design system tạo Staff surface tối thiểu nếu fallback; không dựng Admin dashboard thứ hai. Quân viết Playwright staff/admin, role-negative API, full acceptance RTM; không viết feature frontend. Các test E2E hiện là Customer, chưa phải proof cho ba actor. Chạy regression trên commit cuối mỗi merge liên quan transaction/authorization/migration; lưu run ID, trace, expected/actual, severity và retest.

## 5. Backend — bốn ưu tiên lớn

### 5.1. BE-08: Staff/Admin đã có guard nhưng chưa có RBAC nghiệp vụ đầy đủ

Source main [S7]: `staff-access/policy.ts` kiểm persisted User.metadata.daymark_admin_access; marker tồn tại (kể cả giá trị khác) làm full Admin access bị từ chối. `middlewares.ts` áp dụng `/admin*` với actor user/session/bearer/api-key, guard khi có user actor ID. `create-blocked-staff.ts` tạo user mới từ auth identity chưa liên kết, gán `blocked_staff`; là workflow nội bộ tin cậy, không phải public Staff registration. `staff-authorization.spec.ts` xác nhận Admin đọc 200, Staff GET/POST nhiều endpoint 403, customer/unlinked/tampered JWT 401, session/JWT đã cấp bị thu quyền ngay khi đổi marker. Suite PASS ngày 25/11. Đây là tiến bộ thật so với báo cáo 20/11 BLOCKED; không nói chưa có phân quyền gì.

**Giới hạn:** Guard deny toàn bộ Admin API cho Staff; không có đường nghiệp vụ Staff được allow, không có Staff UI riêng trong cây main đã kiểm. Admin không marker giữ full Medusa Admin quyền chuẩn. Không có evidence license Enterprise; config hiện không đăng ký RBAC. Cần kiểm secret API key/revocation, User service failure, invite lifecycle (không cấp user thường cho Staff), audit user cũ/missing marker, direct route/method bypass và object scope. Đừng gọi guard deny là full RBAC.

Đề xuất chốt ADR-011 trong mốc 26–28/11: ưu tiên **Staff API/surface giới hạn không cần license nếu entitlement vẫn chưa xác minh**; giữ guard Admin, deny-by-default và route riêng có auth đúng actor, validate assignment ở mỗi thao tác. Quý UI tối thiểu, Hoàng server policy. Nếu license được xác nhận, cân nhắc module chính thức và migration trên DB cô lập, rà Super Admin; resource/operation RBAC mặc định không tự thực thi đơn được giao (repo feasibility ghi rõ). Không làm cả hai phương án. Nếu không đủ an toàn, giữ Staff blocked và công bố giới hạn demo, không cấp Admin credential.

| Phạm vi quyền đề xuất, cần duyệt | Customer | Staff | Admin |
|---|---|---|---|
| Profile, order history | Chỉ tài nguyên mình | Không đọc tùy ý hồ sơ khách | Theo policy |
| Order/fulfill/track | Xem đơn mình | Chỉ đơn được giao, chuyển state hợp lệ | Theo quyền |
| Inventory/catalog | Public read | Read và mutation giới hạn nếu duyệt | Quản lý theo policy |
| User/roles/API keys/export | Deny | Deny | Admin được ủy quyền |
| Reporting/COD/refund | Không có admin report | Deny mặc định, ngoại lệ theo policy | Được cấp quyền, có đối soát |

Acceptance: 3 identities + Customer A/B; Staff allow assigned order, deny unassigned/mutation/role/key; Admin allow thực tế, negative khi scope hạn chế; session/JWT/key revoke; state không đổi khi deny. Quân test cả UI và API, Thắng đưa vào gate hiện có. Trung fixture/readback. Chốt OPEN-USR-003/004/011 và PERM-001..005 trước implementation.

### 5.2. BE-03: không viết lại core checkout khi test đã đạt

Report 22/11 SHA `406da58`: hai complete đồng thời cho cùng cart chỉ 1 order/1 payment effect; 20 attempts/5 units cho 5 order/payment/reservation và 15 stock conflict, HTTP suite 3/3. Source merged và API suite current pass. Payload khác cho cùng cart vẫn replay, chưa có intent-key/hash enforcement; timeout chỉ mô phỏng replay sau commit, không socket timeout. Hoàng chốt contract intent/payload: nếu yêu cầu reject khác payload, triển khai wrapper/workflow trước core với stable idempotency key/hash, conflict và lookup; nếu semantics cart đủ, có ADR/SRS được duyệt và test rõ. Không sửa SQL lõi. Test mất response thực, retry sau timeout, payment fail, multi-task Redis distributed lock, reservation/cancel/fulfill. Trung đối chiếu số effects; Quân test lại cùng SHA release.

### 5.3. BE-04: notification từ sandbox sang giao nhận có thể kiểm chứng

Main có outbox model record/attempt, unique dedupe key và migration `Migration20261122090701`; subscriber nhận `order.placed`, `order.canceled`; job cron mỗi phút quét pending/retry_wait, retry 1/5/15 phút, tối đa 4 attempts. Unit policy 3 test, HTTP dedupe/provider down→recover/final failure pass ở report 22/11 và suite pass trên CI. `provider.ts` trả ID `sandbox:` và lưu Set trong instance, **không gửi email thật**; `process-notification.ts` tạo instance mới trực tiếp. Đừng lấy sent nội bộ làm delivered tới khách.

**Phát hiện source cần kiểm ngay:** job không quét `processing` có lease hết hạn; worker chết sau khi set processing có thể để record kẹt. Workflow đọc record/kiểm lease rồi update không thấy compare-and-set/lock nguyên tử trong phần đã đọc; hai worker có thể cạnh tranh claim. Set instance mới không bảo đảm dedupe phía provider qua restart. Đây là rủi ro code review, chưa tái hiện runtime. Hoàng sửa claim atomically/locking Medusa, reclaim expired processing, durable attempt semantics, provider idempotency nếu hỗ trợ, test chết giữa send/persist và enqueue race. Chốt provider sandbox email giao tới inbox thử hoặc kênh được duyệt, không gửi khách thật; nếu provider không hỗ trợ exactly-once phải ghi delivery semantics đúng. Thêm event shipment/delivered được policy duyệt, valid recipient, content privacy, lỗi cuối có cách xử lý. Cron 1 phút có thể vượt mục tiêu 60s; đo end-to-end, điều chỉnh schedule/worker hoặc được duyệt target. Test actual API→Redis→worker→provider→receipt, duplicate/restart/outage/multiworker, không rollback order. Trung/Thắng kiểm migration, observability/backlog. Không cần viết lại outbox.

### 5.4. BE-05/06: vận hành đơn và báo cáo

BE-05 report `b9660ea` 22/11 đã tạo Docker stack riêng, order fixture và 24/24 consistency checks; invite được tạo nhưng chưa accept/login theo role; chưa fulfill/ship/deliver, tracking, COD reconciliation, browser. Contract vẫn Proposed. Dùng native workflow/Admin cho stock/publish/fulfillment, Staff chỉ gọi thao tác được cấp. Tách order.status, fulfillment_status và payment_status. Tracking chỉ dùng dữ liệu carrier được cung cấp hoặc thao tác thủ công ghi rõ; không fake carrier. COD authorize/capture kỹ thuật không phải chứng từ tiền thực. Admin report tối thiểu theo FR-09: count và order value theo trạng thái/kỳ, awaiting fulfillment, low stock, COD collected riêng theo chứng cứ. Không cần BI warehouse. Hoàng triển khai read-only report API/export/native UI đủ yêu cầu sau khi Trung merge definitions; Quý chỉ bổ sung UI thiếu. Kiểm permission/report totals và ngoại lệ. Hoàn tất workflow 3 actor trên fixture.

## 6. Data — trạng thái và backlog thật

DATA-01/02 đã có main từ #19. ERD v3/data dictionary đọc theo Medusa 2.21.2; catalog report 18/11 baseline `1b6a668`: 187 migrations ở DB thử cũ; 30 products, 230 SKU/inventory levels, 3 collections/6 categories, 2.554 stocked units, 30 ảnh HTTP 200. Rerun sau chỉnh SKU tồn +3 giữ 2.557, 0 insert/update/conflict/upload. AWS 18/11 có 30 DAYMARK + 3 bootstrap và ảnh private proxy; không coi fixture là count AWS hôm nay. Nâng version ERD 2.22.7/outbox, validate migration trên DB clone và importer hiện hành, không reset stock.

PR #24 head `caba7d598ea8af50448aecdae53e3735e70d067e` còn open; DATA-03/04 10 file, PR body báo 13/13 local Windows/Postgres 18; CI API success, CI security failure cùng pattern. Report 20/11 trên branch (không main) có simulator success/failure, cancel reservation, duplicate, 20/5, technical COD capture. Pool test-only được điều chỉnh tránh connection limit. Phải review conflict/không mất assertions, chạy Linux PostgreSQL 16, merge khi gate đạt. DATA-04 definitions: Asia/Ho_Chi_Minh, half-open date range, as_of, one order ID, separate VND order value vs COD collected, awaiting fulfillment, low-stock = floor((stocked-reserved)/required_quantity) min theo component, exceptions; có JSON fixture và script. Đây là data contract, chưa phải report API/dashboard. Chốt threshold/permission/COD source (OPEN-REPORT-001/OPEN-USR-011) rồi Hoàng implement. Trung backup/RPO/RTO readback, query plans và connection headroom. Quân kiểm report totals/edge cases. Không để Trung sở hữu Medusa Admin workflow.

## 7. Ops/CI/CD và cloud — Thắng

### 7.1. Cổng CI đã cải thiện nhưng đang FAIL đúng thiết kế

HEAD Actions 45616613520 [S2]: verify PASS (158 unit/18 suites, HTTP 40 pass, 3 skip), browser-container PASS (21 Playwright, 6 skip, scan OS/library HIGH/CRITICAL qua), cloudformation và documentation PASS. API tests 45616614373 PASS gồm integration-tests và load-failure-smoke. Security-policy job 139213538335 FAIL ở Enforce dependency security policy: “Unapproved dependency findings remain; no baseline exceptions”; browser npm install ghi 7 moderate severity vulnerabilities. Không khẳng định 7 là số advisory độc lập hoặc audit artifact đầy đủ. Audit 20/11 từng 0 finding trên dirty tree, 21/11 image clean cũ; không thay kết quả hôm nay. Cần lấy artifact `security-audit-d6790f137c4392b09e28b08bc52fbffe009d0718-1` (15021894200), đọc npm audit JSON, đường dependency/lock/registry/time, xử lý compatible; không `audit fix --force`, không disable policy. Current policy chặn mọi finding chưa được chấp nhận; Trivy pass high/critical không gỡ npm moderate. Thắng triage cùng Hoàng/Quý. `.github/branch-protection/main.json` là cấu hình chuẩn bị, chưa có bằng chứng owner áp dụng thực tế; yêu cầu protection/required checks, không merge PR đỏ bằng bypass. PR #24 cũng security FAIL.

### 7.2. AWS hiện có gì và cần triển khai gì

18/11 preview (source `bae01ce`, digest ghi release.json) trên stack commerce-* Sydney: migration, API/Admin + worker + storefront đều stable 1/1, import catalog/media, HTTPS, private S3 proxy, Admin bootstrap secrets injection, COD tạo/retry/cancel và available stock hồi phục; lease đến 03:48 VN 19/11. Không gửi email, chưa Staff/RBAC, load/alert/restore. 21/11 report runtime-images: chuyển Node Alpine, 0 HIGH/CRITICAL local Trivy và ECR scan COMPLETE cho cặp image `secure-6f796d11867c` từ source `6f796d11867cf6ee537ee2beaa10b81285257482`; change set `review-5a1abc72b740` stage app Running=false, API/worker/storefront desired/running=0, RDS/Redis stopped, lease hết; không xóa foundation/data. Migration cũ đã snapshot trước khi stage, không restore drill. Đây là lần inventory gần nhất đã đọc, không xác nhận AWS trạng thái 26/11. Không deploy HEAD vì CI đỏ và image cũ không có các commit mới.

OPS-06/07 evidence 19–20/11: request/operation correlation JSON logs, k6 local smoke catalog p95 66,49ms (10 iterations), complete 423,93ms và whole intent 2.587ms (1 checkout), recovery 53,13ms, DB pause/unpause và invalid key; không phải load capacity. Dashboard/IaC code, SNS confirmation/test alert hoãn, chưa cloud ingestion/alert receipt, Redis metrics, 5x/10x, backup restore/rollback. OIDC publisher, ECR validator và manage.py start guard có code, publication cũ có evidence; cần chạy workflow đúng RC và verify IAM trust/environment/SCP, scan digest. Release phải có immutable SHA/digests, previous versions và approved change set; không dùng latest tag.

### 7.3. Chi phí và lease

Mô hình giá Sydney trong report 19/11 [S13], mới hơn baseline cũ 168,17 USD: 0,22252 USD/giờ chạy (giả định 2 vCPU/5GiB tổng, một task mỗi vai trò, một LCU); retained mô hình 13,736 USD/tháng. 40 giờ/tháng hibernate ngoài phiên 22,6368 USD, pause giữ ALB 46,9248 USD; always-on 730h 176,1756 USD, cộng reserve minh họa 20 USD thành 196,1756 USD. Đây là gross model, chưa gồm egress/inter-AZ, scale-out, thuế và biến phí khác, không phải hóa đơn. Mục tiêu 100 USD chưa duyệt. RDS có thể tự restart, lease không phải hard spend cap; inventory billing và approval trước start/renew/load. Giữ demo có time window, không xóa retained data để giảm phí. Thắng chốt cost estimate mới và thời lượng test được duyệt với Quý.

## 8. Đối soát đủ 36 task Tuần 1 (v1.3)

Các trạng thái dưới đây là review chứng cứ, không phải biên bản check 18/20/22. Mã cũ giữ nguyên. PASS-SLICE không đồng nghĩa 100% FR acceptance. Không giao lại phần đã đạt; đóng khi reviewer xác nhận đúng scope/SHA.

| Task / owner | Review 26/11 | Phần cần làm / kiểm lại |
|---|---|---|
| FE-01 Quý | PASS-SLICE | CI build/browser đã có; cập nhật route matrix đầy đủ |
| FE-02 Quý | PASS-SLICE | Catalog/PDP/search pass; cloud media + sort/filter edge |
| FE-03 Quý | PARTIAL | A/B isolation/auth pass; profile/address/guest policy |
| FE-04 Quý | PASS-SLICE | COD/cart E2E pass; lost-response UX theo BE-03 |
| FE-05 Quý | PARTIAL | History/status pass; fulfillment/tracking live fixture |
| FE-06 Quý | PASS-SLICE | Responsive/design pass; rerun đúng RC, ảnh |
| FE-07 Quý | PASS-SLICE | OFF fallback pass; 404/500/timeout chưa chứng minh |
| TL-01 Quý | PARTIAL | #21/#22 merged; đóng ADR, CI đỏ/PR #24, RC sign-off |
| OPS-01 Thắng | PASS-SLICE | Disposable compose/harness; verify new fixtures/migration |
| OPS-02 Thắng | PARTIAL | Unit/HTTP/IaC/build gate chạy, security FAIL |
| OPS-03 Thắng | PASS-SLICE | Browser-container 21 pass/6 skip; mở rộng Staff E2E |
| OPS-04 Thắng | PASS-SLICE | Docker build/smoke/scan pass; publish đúng RC |
| OPS-05 Thắng | BLOCKED | npm security-policy FAIL, triage artifact, required gate |
| OPS-06 Thắng | PARTIAL | AWS preview + staged image cũ; inventory/approval/new deploy |
| OPS-07 Thắng | PARTIAL | Local logs/k6 smoke; cloud monitoring/load/alert/restore |
| BE-01 Hoàng | PASS-SLICE | Native/legacy boundary + auth tests; final regression |
| BE-02 Hoàng | PASS-SLICE | Checkout/COD/simulator; reconcile capture/negative |
| BE-03 Hoàng | PARTIAL | Duplicate/20/5 pass; mismatch/lost response/multi-task |
| BE-04 Hoàng | PARTIAL | Outbox/HTTP pass; inbox/event status/worker restart |
| BE-05 Hoàng | PARTIAL/BLOCKED | Order readback 24/24; Staff lifecycle và fulfillment/COD |
| BE-06 Hoàng | PARTIAL/NV | DATA-04 definitions PR #24; chưa thấy report implementation acceptance |
| BE-07 Hoàng | PARTIAL | 158 unit/40 HTTP pass hiện tại; worker E2E, role positive |
| BE-08 Hoàng | BLOCKED/PARTIAL | Persisted Staff deny pass; thiếu allowed surface/license policy |
| DATA-01 Trung | PASS-SLICE | ERD v3 merged; update 2.22.7/outbox |
| DATA-02 Trung | PASS-SLICE | Import/rerun local+preview; verify RC migration/actual counts |
| DATA-03 Trung | PR-OPEN | #24 reconcile tests, review/merge khi CI xanh |
| DATA-04 Trung | PR-OPEN | #24 definitions/fixture, chốt policy; Hoàng implement |
| DATA-05 Trung | PARTIAL | Migration preview/image staging; isolated restore/RPO/RTO |
| DATA-06 Trung | NV/PARTIAL | Recommendation fallback có; chưa đủ rights/consent evidence; giữ OFF |
| QA-01 Quân | PARTIAL | RTM/SRS có; chưa thấy consolidated 9 UC acceptance mới |
| QA-02 Quân | PASS-SLICE | Disposable harness, fixture và CI; bổ sung role fixtures |
| QA-03 Quân | PASS-SLICE | 21 Chromium pass; 6 skip, Staff/fulfillment chưa chạy |
| QA-04 Quân | PARTIAL | HTTP auth/concurrency pass; multiworker/retry/positive Staff |
| QA-05 Quân | BLOCKED/PARTIAL | Sandbox/deny Staff pass; inbox và Staff lifecycle thiếu |
| QA-06 Quân | PARTIAL | CI artifacts mới; defect register + retest + security red |
| QA-07 Quân | PARTIAL | RC1 preflight/checkpoint report có; chưa final sign-off |

## 9. Kế hoạch hai tuần tới — checkpoint, không giao theo ngày

Đích gốc 06/12 còn 10 ngày sau 26/11, cửa sổ 14 ngày đến 09/12. Giữ deadline cũ; dự phòng 07–09/12 chỉ khi được duyệt. Ưu tiên P0 = chặn nghiệm thu, P1 = cần cho chất lượng/engineering demonstration, P2 = optional. Nếu P1 là mục tiêu bắt buộc chưa đạt, vẫn không GO đầy đủ. Freeze feature sau 29/11, không mở AI hay redesign. Mốc check là đầu ra phải trình, không dồn tất cả task đến 06/12.

| Checkpoint | Gate và evidence | Xử lý nếu chưa đạt |
|---|---|---|
| 26/11 — Rebaseline | HEAD/CI FAIL, PR #24, 36 task matrix, owner và quyết định Staff/provider/COD/budget | Chốt scope blocker, lấy audit artifact, không deploy |
| 28/11 — P0 implementation | Security fix candidate, Staff allow/deny thử, notification claim/reclaim + provider thử, report fixture và transaction contract | Không cấp Staff Admin full; giữ guard, issue P0 |
| 29/11 — RC gate | Merge #24 sau review/CI, 9 UC smoke và role/notification/transaction tests, audit clear, freeze; RC SHA | Chưa GO nếu security/authorization/transaction fail; tiếp tục cô lập |
| 02/12 — AWS staging | Approved budget, digest scan, migration/backup, HTTPS và 3 service healthy, cloud smoke đúng SHA | Stop/rollback theo runbook; không reseed DB |
| 04/12 — Engineering evaluation | Load baseline+peak, cloud 3 actors/notification/stock, monitoring/alert, restore và rollback rehearsal | Retest P0, không promote nếu thiếu proof |
| 06/12 — Acceptance | RTM 9/9 + NFR, CI/digests, demo, docs, known limits và GO/NO-GO | NO-GO hoặc demo giới hạn ghi rõ; 07–09/12 contingency nếu duyệt |

Critical path: fix security + chốt Staff/provider/intent → code & tests → #24/RC integration → CI green → immutable ECR + migration/approval → staging → cloud evaluation/restore → final. Workstream QA/Data/Ops chạy song song, không đợi backend xong mới chuẩn bị.

## 10. Phân công chi tiết theo từng người — backlog còn lại

Mỗi work package có chủ sở hữu chính, output và DoD. Các mốc dưới đây là đề xuất quản lý, không phải cam kết cá nhân đã được duyệt. Nghiệm thu trên SHA mới; không làm lại code đã PASS-SLICE nếu regression vẫn đạt. P0 liên quan security/roles/transaction/notification và release được làm trước. Giữ ranh giới Hoàng nghiệp vụ, Quý toàn bộ frontend, Trung data, Thắng infra/CI, Quân QA/docs.

### 10.1. Quý — Tech Lead và toàn bộ Frontend

| Work package | Check / ưu tiên | Đầu ra và tiêu chí Done |
|---|---|---|
| R-FE01 / TL-01 — RC integration | 26/11, 29/11 · P0 | Chốt baseline, ma trận 36 task; duyệt ADR Staff/intent/COD/provider; review #24 và PR mới, yêu cầu green CI; RC SHA + release manifest. |
| R-FE02 / FE-01..04 — Regression thay vì rebuild | 28–29/11 · P0 | Customer journey smoke đã có, sửa chỉ lỗi mới: profile/address, cart recovery, checkout error/lost response, catalog ảnh/price; Quân E2E trên đúng SHA. |
| R-FE03 / BE-08 — Staff UI tối thiểu | 28/11 prototype; 29/11 integrated · P0 | Theo ADR đã duyệt: nếu dùng fallback, login/trang danh sách đơn được giao, detail và nút chuyển state đúng quyền; không cấp Admin token. Nếu Enterprise đủ, dùng Admin UI phù hợp. Hoàng API/guard, Quân test. |
| R-FE04 / FE-05..07, BE-06 — Tracking và report UI | 29/11 core, 02/12 cloud · P0 | Order status/fulfillment/COD hiển thị thật từ fixture; Admin report dùng UI native/export nếu đủ, bổ sung view nhỏ nếu thiếu; recommendation OFF fallback. |
| R-FE05 — Freeze, review và release | 02/04/06/12 · P0 | Review PR P0, cloud UI smoke, responsive/assets, xác nhận CI/digest/ADR và ký GO/NO-GO với QA/Cloud. Không nhận redesign mới. |

### 10.2. Hoàng — Backend Medusa / nghiệp vụ

| Work package | Check / ưu tiên | Đầu ra và tiêu chí Done |
|---|---|---|
| R-BE01 / BE-08 — Staff có quyền làm việc | 26/11 ADR; 28–29/11 · P0 | Giữ Admin guard, chốt role matrix/assignment/identity lifecycle, triển khai restricted surface hoặc RBAC hợp lệ; Staff positive và negative server-side, không bypass token/key, không cấp quyền dư. |
| R-BE02 / BE-03 — Intent correctness | 28–29/11 · P0 | Giữ tests 20/5 và duplicate đã đạt; chốt khác payload/intent, kiểm lost-response thật, retry/distributed locking và reservation readback; fix chỉ gap đã xác định. |
| R-BE03 / BE-04 — Notification delivery | 28/11 claim/reclaim + provider; 29/11 gate · P0 | Outbox atomic claim, expired processing recovery, durable dedupe, policy event đủ điều kiện, configured provider gửi inbox thử, retry bounded/final error có thể xử lý, worker E2E với Redis; 95%/60s phải đo. |
| R-BE04 / BE-05/06 — Fulfillment/reporting | 29/11 · P0 | Staff được giao xử lý đơn bằng workflow chuẩn, Admin stock/publish, shipped/delivered thủ công có chứng cứ, COD reconcile; reporting read-only theo DATA-04 và permission; test số liệu/negative. |
| R-BE05 / BE-07 — Release hardening | 29/11, 02/04/06/12 · P0 | Phối hợp dependency fix, lint/typecheck/unit/HTTP đồng SHA, migration/outbox và worker runtime, retest cloud; không sửa core DB bằng SQL. |

### 10.3. Trung — Data engineering / PostgreSQL

| Work package | Check / ưu tiên | Đầu ra và tiêu chí Done |
|---|---|---|
| R-D01 / DATA-03, DATA-04 — Merge #24 | 26–29/11 · P0 | Review conflict, fixture tests, Linux PG16 CI, audit gate xanh, merge; giữ assertions BE-03/04; bàn giao contract report cho Hoàng, không chờ đến deploy. |
| R-D02 / DATA-01, DATA-02 — Schema/fixture | 28/11 · P0 | Update ERD/data dictionary 2.22.7 và notification tables; 30/230 fixture, 30 ảnh/hash, test import rerun bảo toàn tồn, role fixtures không credentials. |
| R-D03 / DATA-03, DATA-04 — Reconcile nghiệp vụ | 29/11, 02/12 · P0 | Before/after order/payment/reservation/fulfillment/COD/notification, 20/5 + retry, report expected totals, exceptions, timezone/as_of và low-stock threshold được duyệt; hỗ trợ Hoàng/QA. |
| R-D04 / DATA-05 — Migration/restore | 02/12 migration; 04/12 drill · P0 | Snapshot/recovery point trước migration, schema compatibility, restore vào DB cô lập, readback manifest và đo RPO/RTO; phối hợp Thắng. Không reseed retained data. |
| R-D05 / DATA-06 — Performance/data quality | 04/12 · P1/P2 | RDS connections/query plans, index chỉ khi có đo, catalog/report/notification consistency; rights/consent nếu recommendation bật; nếu không giữ OFF. |

### 10.4. Thắng — DevOps / CI/CD / AWS

| Work package | Check / ưu tiên | Đầu ra và tiêu chí Done |
|---|---|---|
| R-OPS01 / OPS-05 — Security unblock | 26/11 audit artifact; 28–29/11 green · P0 | Phân tích JSON advisory/root chain và lockfile; patch tương thích với Hoàng/Quý; clean npm ci/audit enforce, no bypass. Cập nhật required checks với chủ repo. |
| R-OPS02 / OPS-01..04 — RC CI/artifacts | 29/11 · P0 | Dùng pipeline đã có, tích hợp Staff positive/negative, worker Redis E2E và new fixtures; CI/API xanh đúng RC, browser evidence và Trivy pass; lưu artifacts, không tự viết hết test nghiệp vụ. |
| R-OPS03 / OPS-06 — AWS release | 26/11 inventory/approval, 02/12 deploy · P0 | Kiểm retained stack, cost, IAM/OIDC; publish immutable image, ECR scan COMPLETE 0 high/critical, change set/migration/backup/lease, start staging có phê duyệt; HTTPS health 3 service, business smoke. |
| R-OPS04 / OPS-07 — Observability/NFR | 02–04/12 · P0 | CloudWatch ingestion/dashboard, request→order→notification join, alarm SNS nhận/ack, k6 catalog/checkout/peak, CPU/RAM/connections/Redis backlog; Quân test, Trung readback. |
| R-OPS05 — Recovery/FinOps/handoff | 04–06/12 · P0 | Rollback rehearsal đúng digest/schema, restore drill cùng Trung, budget actual/model/lease/cleanup, release manifest & runbook, approved stop/pause/hibernate theo môi trường. |

### 10.5. Quân — QA, Testing, Documentation

| Work package | Check / ưu tiên | Đầu ra và tiêu chí Done |
|---|---|---|
| R-QA01 / QA-01/02/07 — RTM rebaseline | 26–28/11 · P0 | Lấy Actions/report mới, 36 task evidence và 9 UC/3 actor traceability; phân biệt skipped/blocked; chốt expected outcomes từ policy đã duyệt, issue P0. |
| R-QA02 / QA-03 — Browser regression | 28–29/11 · P0 | Giữ 21 PASS, ghi rõ 6 H&M skip; thêm ảnh DAYMARK, Staff/Administrator workflow, A/B ownership, tracking/COD/error recovery và responsive. Quý sửa UI. |
| R-QA03 / QA-04/05 — Negative/transaction/event | 28–29/11 · P0 | Direct role API allow/deny/assignment, spoof/expired/key/revoke, lost response/mismatch/20-5, notification worker restart/provider delivery/final error, report reconciliation. Không chỉ unit hoặc build. |
| R-QA04 / QA-06 — Cloud verification | 02–04/12 · P0 | Smoke đúng digest, 9 UC, regression P0, k6/alert/restore evidence với Thắng/Trung; theo dõi defect severity/owner/PR/trace/retest. |
| R-QA05 / QA-07 — Final acceptance | 06/12 · P0 | RTM kết quả PASS/PARTIAL/FAIL/BLOCKED/NOT RUN, index artifact, demo script 3 actor, NFR measured, ADR/SRS/ERD cập nhật, known limitations và đề nghị GO/NO-GO độc lập. |

## 11. Kế hoạch triển khai AWS chi tiết

Kiến trúc đích giữ modular monolith Medusa + Next.js, không thêm microservice/BI lớn. Sydney `ap-southeast-2`: ALB/ACM HTTPS → ECS Fargate storefront, API/Admin, worker → RDS PostgreSQL (Single-AZ theo baseline), Redis EC2; S3 private image proxy; ECR, CloudFormation, CloudWatch. Không tuyên bố HA/production SLA. Kiểm stack hiện hành trước bất kỳ ghi nào; 21/11 app staged nhưng dừng, không mặc nhiên đang chạy. Hạ tầng dùng lại, không tạo mới nếu không cần.

| Giai đoạn | Thao tác và điều kiện nghiệm thu |
|---|---|
| 1. Read-only preflight (26/11) | Thắng kiểm AWS account/Region/stack, ECS desired/running/task definitions, RDS status/recovery point, Redis, ALB target/ACM/DNS, S3/ECR, alarms/lease/billing; xác nhận quyền OIDC/approval và thời gian UTC. Không đọc/in secrets. |
| 2. Release candidate (29/11) | Quý chốt full SHA sau review/#24, CI + API tests green, npm policy pass, role/transaction/notification gates, no P0. Quân xác nhận test proof. Không dùng image cũ hoặc latest. |
| 3. Publish & scan (trước 02/12) | Chạy aws-images workflow trên đúng approved RC; kiểm OIDC trust, ECR immutable tags/digest pair, scan COMPLETE và 0 HIGH/CRITICAL; lưu report. Dùng guard có sẵn trong manage.py, không sửa bỏ kiểm tra. |
| 4. Data safety & change set | Trung/Thắng kiểm migration 2.22.7/outbox/Staff, snapshot và recovery point mới, restore clone/readback trước nếu cần, change set no destructive replacement. Không seed/reset DB AWS, không rollback bằng down migration tùy tiện. |
| 5. Start staging (02/12) | Dùng runbook/approved lease; chạy migration một lần thành công trước traffic, API/Admin, worker, storefront dùng digest đúng, health + target steady. Worker không phục vụ Admin routes, secret injection qua AWS. Kiểm S3 byte/hash, unsigned/private prefix deny, no production simulator. |
| 6. Cloud E2E + NFR (02–04/12) | Customer mua, Staff assigned fulfillment, Admin report/stock, notification receipt và negative role, order/payment/stock readback; k6, alert, restore/rollback drill. Sử dụng dữ liệu synthetic đã duyệt, không gây tác động khách thật. |
| 7. Promote & handoff (06/12) | Quý ký GO; promote đúng immutable digest đã kiểm, không rebuild. Nếu staging chính là demo stack, ghi rõ mở cửa sổ demo đã duyệt. Post-deploy probes, CI/digest/DB manifest, rollback runbook, lease/cleanup. |

**Rollback policy:** health/5xx vượt ngưỡng, auth/data P0, migration fail, lost notification/oversell → stop promotion; đưa traffic về digest trước nếu schema tương thích. Không khôi phục chồng lên DB thật tùy tiện. Nếu schema không tương thích, giữ traffic đóng và forward fix hoặc restore có phê duyệt, kiểm readback. Đo thời gian thực tế; backup tồn tại không là restore test. Giữ app stack dừng nếu security gate đỏ. Không tự triển khai hoặc phát sinh chi phí trong lần review này.

## 12. NFR, test plan và release gate

Mục tiêu số dưới đây kế thừa audit 16/11 và yêu cầu môn học. Đề bài yêu cầu định nghĩa NFR/peak/p95/recovery/budget; các ngưỡng là TARGET, cần chốt với nhóm, không tự hạ để đạt. Có evidence smoke local và API load-failure-smoke nhưng chưa đủ workload dài và cloud. Dùng cùng SHA/digest, fixture và môi trường được ghi. Bất kỳ lỗi P0 phải retest trước release.

| Test / TARGET | Bằng chứng phải có để nghiệm thu |
|---|---|
| 9 UC + Customer/Staff/Admin | RTM 9/9, role allow/deny server + browser; Admin/Staff có đường nghiệp vụ thực tế. |
| Catalog 30 RPS × 10 phút, p95 <600ms, lỗi <1% | k6 raw JSON, dropped iterations, cache/DB/ECS metrics; smoke 66,49ms lịch sử không thay long-run. |
| Checkout 3 journeys/s × 5 phút, p95 complete <1.500ms | Phân biệt complete request và whole journey, error rate, stock/payment/order readback. |
| Peak 150 RPS browse × 5 phút, p95 <1.200ms | Ramp/steady/recovery; autoscaling task count và resource headroom; không coi một smoke là scaling. |
| 20 parallel purchases / 5 units | Test 20/5 đã PASS local; chạy lại khi Redis/multi-task/cloud; 5 success, 15 conflict, no duplicate/oversell. |
| Notification ≥95% trong 60s | Receipt thật tới inbox thử, timestamp event→delivery, restart/claim/retry/dedupe và final failure; không dùng sandbox sent làm delivered. |
| Alert được nhận ≤5 phút | CloudWatch alarm transition, confirmed SNS/subscription, người nhận ack, UTC timeline. |
| RPO ≤60 phút, RTO ≤120 phút | Restore DB mới cô lập, timestamps/readback, measured RPO/RTO; rollback app digest separate. |
| Availability ≥99,5% cửa sổ demo | Probes, denominator và window công bố; không công bố SLA 24×7. |
| Budget mục tiêu 100 USD/tháng chưa duyệt | Estimate mới, lease/approval, retained costs và actual billing; always-on model 176,18 USD chưa gồm biến phí. |

**GO/NO-GO 06/12:** 9 UC đạt, Staff positive/negative và lifecycle đủ, notification actual delivery/retry, không P0 duplicate/oversell/privacy, full CI green kể cả security-policy, ECR scan pass đúng digest, cloud HTTPS/worker/storage/migration/restore/rollback/monitoring, NFR evidence, budget approval và RTM/ADR/demo. Nếu thiếu P0 hoặc engineering demonstration bắt buộc, NO-GO bản đầy đủ. Có thể demo giới hạn cô lập với known issues và acceptance scope thật; không gọi FEATURE COMPLETE, không lách Staff guard. Quý quyết định sau xác nhận Hoàng/Trung/Thắng/Quân.

### 12.1. Rủi ro trọng yếu và cách giảm

| ID / priority | Risk / owner | Mitigation / checkpoint |
|---|---|---|
| R1 P0 | Security gate FAIL — Thắng | Audit artifact ngay 26/11, fix compatible, green CI 29/11. |
| R2 P0 | Staff chỉ bị deny — Hoàng/Quý | ADR, assignment guard và UI nhỏ, positive/negative 28–29/11. |
| R3 P0 | Notification sandbox/lease/crash — Hoàng | Provider/inbox, atomic claim + reclaim, worker restart test 29/11. |
| R4 P0 | Fulfillment/COD/report chưa đủ — Hoàng/Trung | Merge #24, contract, lifecycle và report readback 29/11. |
| R5 P0 | Real lost response/multi-task contention — Hoàng | Intent contract, Redis multi-task tests, cloud 04/12. |
| R6 P0 | Deploy sai SHA / migration dữ liệu — Thắng/Trung | Gate, immutable ECR, snapshot, non-destructive change set, restore 02–04/12. |
| R7 P1/P0 gate | Alert/load/restore và cost chưa nghiệm thu — Thắng/Quân | Approval, đo cloud và ack, RPO/RTO 04/12; thiếu bắt buộc không GO. |
| R8 P1 | Doc version cũ và scope trôi — Quân/Quý | RTM đồng SHA, update 2.22.7/ADR, freeze 29/11; 07–09/12 dự phòng có duyệt. |

### 12.2. Handoff và demo cuối kỳ

Một release manifest có full SHA, PR, CI run, backend/storefront image digest, DB migration, approved UTC lease/budget. Evidence index: report unit/HTTP/browser (skip reasons), RBAC matrix, notification records/receipt đã giảm PII, reconciliation/fixture, k6 raw, CloudWatch alert/availability, restore/rollback, cost và known limits. Cập nhật SRS/RTM, ERD, ADR, API contract, runbook. Mỗi checkpoint: Owner | task ID | status | SHA/PR | expected/actual | evidence | blocker | next action | reviewer. Không lưu token, password, invite link hoặc PII thật trong repo/report.

Demo đề xuất: Admin login, publish và stock → Customer search/cart/COD → Staff chỉ thấy đơn được giao, xử lý fulfillment/tracking có chứng cứ → Customer history + notification → Admin report và COD/stock reconcile; tiếp theo direct role deny, retry/20-5, CI/CD, monitoring/peak/recovery. Không dùng tài khoản Admin thay Staff để nói đã đủ 3 actor. Nếu Staff vẫn blocked, ghi rõ trong demo.

## 13. Nguồn kiểm chứng và giới hạn của báo cáo

Nguồn trực tiếp GitHub đọc ngày 26/11; file links nên dùng full SHA để tái lập. Các báo cáo có ngày được đọc tại HEAD, nhưng evidence runtime trong chúng thuộc revision/môi trường ghi bên trong. Số liệu hiện tại ưu tiên log Actions. Link PR/Actions là nguồn kiểm chứng live. Đã đối chiếu kế hoạch Tuần 1 v1.3 và Project Topics trang 4–5. Các nhận xét claim/restart là code review, không phải test failure đã tái hiện. Không đăng nhập AWS, không chạy lại pipeline hoặc thay đổi repository. Đề xuất Staff fallback và checkpoint là quyết định đề xuất cần duyệt. Bản v2.1 thay v2.0-draft.

- [S1] HEAD + compare: https://github.com/kieuquy283/EnterpriseE-commercePlatform/commit/d6790f137c4392b09e28b08bc52fbffe009d0718 ; https://github.com/kieuquy283/EnterpriseE-commercePlatform/compare/084f2297ac00f90cab59692865439a6ba5139855...d6790f137c4392b09e28b08bc52fbffe009d0718
- [S2] CI main: https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/45616613520 (verify job 139213538303; security job 139213538335; browser-container job 139213538604).
- [S3] API tests main: https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/45616614373 (integration job 139213541396; load-failure-smoke 139213540941).
- [S4] apps/backend/package.json, medusa-config.ts; docs/technical/dependency-security.md; docs/spec/01-business.md; docs/03-requirements/SRS.md, tại HEAD.
- [S5] docs/report/rc1-checkpoint3-2026-11-21.md; docs/report/rc1-preflight-2026-11-21.md; PR #21: https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/21
- [S6] docs/report/be-03-duplicate-retry-concurrency.md; docs/report/be-07-backend-test-evidence.md; PR #22: https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/22
- [S7] apps/backend/src/modules/staff-access/policy.ts; apps/backend/src/workflows/create-blocked-staff.ts; apps/backend/src/api/middlewares.ts; apps/backend/integration-tests/http/staff-authorization.spec.ts; docs/report/staff-admin-authorization-2026-11-19.md; docs/report/be-08-role-negative-http-browser-test-report.md; docs/06-architecture/adr/ADR-011-staff-admin-rbac.md; docs/technical/staff-admin-rbac-license-feasibility.md.
- [S8] apps/backend/src/jobs/process-notifications.ts; apps/backend/src/subscribers/customer-notifications.ts; apps/backend/src/workflows/notification/process-notification.ts; apps/backend/src/modules/notification-sandbox/provider.ts; apps/backend/src/modules/notification-outbox/models/notification-record.ts; Migration20261122090701.ts trong module migrations; apps/backend/integration-tests/http/notification-outbox.spec.ts; docs/report/be-04-notification-test-report.md; docs/technical/be-04-notification-event-flow.md.
- [S9] docs/report/be-05-staff-walkthrough.md; docs/technical/be-05-status-contract.md.
- [S10] docs/technical/database-baseline.md; docs/report/daymark-catalog-validation-2026-11-18.md; PR #19 https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/19 ; PR #24 https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/24 ; PR CI https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/45636212522 ; PR API https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/45636212735 ; docs/technical/reporting-data-definitions.md và docs/report/checkout-reconciliation-2026-11-20.md ở head #24.
- [S11] docs/report/aws-preview-2026-11-18.md; docs/report/ops-dependency-integration-2026-11-20.md.
- [S12] docs/report/runtime-images-2026-11-21.md; PR #18 https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/18 ; docs/technical/operations-readiness.md; CI historical https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/44907077379
- [S13] docs/report/ops-observability-2026-11-19.md; docs/technical/operations-readiness.md. Mô hình giá có ngày, không phải hóa đơn hiện hành.
- [S14] Project files: Cloud Application Development - Project Topics.pdf, trang PDF 4–5; DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.docx; DAYMARK_Project_Status_Assessment_2026-11-16.md và v1.1_RBAC.docx.
