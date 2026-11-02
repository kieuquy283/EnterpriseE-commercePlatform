# PROJECT DEFINITION

> **Định nghĩa dự án, bài toán kinh doanh và tiêu chí thành công**

**PHIÊN BẢN** 1.0 – Bản thảo hoàn chỉnh phục vụ review nhóm     **|     NGÀY**  02/11/2026

**HỆ THỐNG:** Enterprise E-commerce Platform · Medusa v2 / Next.js / PostgreSQL / Redis

**BASELINE CODE:** main d0bf45a; recommendation a98457c (đánh giá độc lập)

**TÌNH TRẠNG:** Chưa có xác nhận phê duyệt stakeholder; các mục tiêu đề xuất chưa phải số đo đã đạt.

> Tài liệu học thuật cho nhóm phát triển hệ thống bán lẻ giả định; không phải hợp đồng với doanh nghiệp thực tế.

## 1. Tóm tắt điều hành

Enterprise E-commerce Platform là một hệ thống thương mại điện tử phục vụ doanh nghiệp bán lẻ trực tuyến giả định tại Việt Nam. Dự án xây dựng một lát cắt nghiệp vụ đầy đủ từ khám phá sản phẩm, quản lý giỏ hàng đến checkout, thanh toán mô phỏng/COD, tạo đơn và theo dõi đơn. Giá trị enterprise của đồ án nằm ở khả năng kiểm soát trạng thái giao dịch, bảo toàn tồn kho, xử lý request trùng/lỗi, kiểm soát truy cập, triển khai cloud và đo lường hiệu năng/chi phí — không ở số lượng tính năng phụ trợ.

Nền tảng dùng Medusa v2 làm nguồn chuẩn của các thực thể commerce, Next.js cho giao diện khách hàng, PostgreSQL cho dữ liệu giao dịch và Redis cho cache/event bus/workflow. Ứng dụng hiện đã có mua hàng end-to-end và kiểm thử backend; các yêu cầu notification, idempotency đầy đủ, cloud E2E, observability và recovery vẫn còn khoảng trống. Dữ liệu H&M và Recommendation là phần mở rộng có giới hạn quyền sử dụng, không thay thế core business flow. [SRC-01..10]

**Quy tắc diễn giải**  Đây là project definition cho một bối cảnh doanh nghiệp giả định; lợi ích và KPI đề xuất là mục tiêu cần kiểm chứng, không được trình bày thành kết quả kinh doanh đã đo.

## 2. Business context & problem statement

### 2.1 Bối cảnh và khách hàng mục tiêu

Một nhà bán lẻ quy mô vừa cần vận hành kênh bán hàng trực tuyến liên tục, cho phép khách duyệt sản phẩm và đặt hàng, đồng thời bảo đảm các hoạt động quản lý sản phẩm, tồn kho, đơn hàng và chăm sóc khách hàng có thể kiểm soát. Trong phạm vi đồ án, doanh nghiệp là giả định; chưa có doanh nghiệp tài trợ, số liệu traffic/sales thực tế hay hợp đồng SLA.

### 2.2 Vấn đề kinh doanh

| **Mã** | **Vấn đề** | **Hệ quả nếu không xử lý** |
| --- | --- | --- |
| BP-01 | Catalog / giá / tồn kho phân tán hoặc không nhất quán | Khách đặt sản phẩm không còn khả dụng, gây hủy đơn và mất tin cậy. |
| BP-02 | Checkout nhiều bước có thể lỗi hoặc bị gửi lặp | Nguy cơ duplicate order/payment, sai reservation và khó đối soát. |
| BP-03 | Thông báo và xử lý phụ trợ nằm trên đường đi đồng bộ | Checkout chậm; lỗi email có thể ảnh hưởng giao dịch chính. |
| BP-04 | Thiếu khả năng theo dõi lỗi/hiệu năng/hạ tầng | Khó phát hiện gián đoạn, không có bằng chứng SLO hoặc bottleneck. |
| BP-05 | Deploy bằng thao tác thủ công thiếu kiểm soát | Rủi ro khác biệt môi trường, lỗi migration và khó rollback. |
| BP-06 | Độ cao truy cập đọc và cao điểm khuyến mại | Catalog/search cần caching, khả năng chịu tải theo workload đã định. |

### 2.3 Business problem statement

Một doanh nghiệp bán lẻ trực tuyến giả định cần một nền tảng thương mại đáng tin cậy vì các giao dịch giỏ hàng–thanh toán–đơn hàng–tồn kho phải được xử lý nhất quán ngay cả khi có request trùng, lỗi phụ thuộc và lưu lượng truy cập biến động. Người dùng chính gồm Customer, Store/Operations Staff và Administrator. Kết quả mong muốn là một purchase journey có thể hoàn tất và truy vết trên cloud, có tiêu chí kiểm thử cụ thể về chính xác giao dịch, bảo mật, hiệu năng, recovery và chi phí.

## 3. Tầm nhìn, giá trị và mục tiêu

### 3.1 Vision

Xây dựng một production-oriented MVP cho bán lẻ trực tuyến: đủ đơn giản để vận hành bằng ngân sách và nhân lực của đồ án, nhưng có ranh giới nghiệp vụ, quy trình triển khai, chất lượng và hồ sơ bằng chứng tương tự cách tiếp cận enterprise engineering.

### 3.2 Business outcomes (giả định để thiết kế)

- Khách hàng có thể tìm, mua và theo dõi đơn hàng thông qua cùng một trải nghiệm; không hiển thị giao dịch thành công giả.
- Bộ phận vận hành có một nguồn dữ liệu chính thống cho product/variant, pricing, cart, order, inventory và payment state.
- Sự cố ở notification/search/cache không được tạo kết quả order sai hoặc phá vỡ checkout trong phạm vi chính sách fallback.
- Đội kỹ thuật có khả năng tự động kiểm tra build/test, triển khai, khôi phục và đo SLO trên môi trường staging.

### 3.3 SMART objectives và success measures

| **ID** | **Mục tiêu và tiêu chí xác nhận** | **Hiện trạng ở baseline** |
| --- | --- | --- |
| OBJ-01 | Có demo Browse → Catalog/Search → PDP → Cart → Checkout → Order → Order History; bài test được lặp lại trên staging. | Luồng và backend HTTP integration đã có; cloud E2E chưa xác minh. |
| OBJ-02 | Payment failure không tạo Order; duplicate/retry cùng cart không tạo nhiều Order ngoài ý muốn; có evidence concurrency. | Failure path có test; duplicate/concurrency chưa có đầy đủ. |
| OBJ-03 | Inventory reservation và order links đúng; kiểm thử thêm hai checkout đồng thời/stock thấp. | Có evidence local 24/24 cho một lần checkout; chưa chứng minh concurrency. |
| OBJ-04 | Thông báo order bất đồng bộ, retry có giới hạn và lỗi email không rollback Order. | Redis/worker có cấu hình; chưa có notification workflow cuối. |
| OBJ-05 | Catalog đạt workload k6 30 RPS/10 phút với p95 <600 ms, error <1% trên profile đo đã ghi. | Có script và threshold; chưa có báo cáo benchmark. |
| OBJ-06 | Checkout đạt workload k6 3 RPS/5 phút, p95 complete <1.500 ms, error <1% trên profile đo đã ghi. | Có script và threshold; chưa có kết quả tải. |
| OBJ-07 | Staging cloud truy cập HTTPS, CI/CD có release evidence, monitoring và rollback rehearsal. | CI pass; CD/runbook có code nhưng chưa thấy cloud run. |
| OBJ-08 | Chứng minh backup/restore và ghi nhận RPO ≤60 phút, RTO ≤120 phút theo kịch bản được phê duyệt. | Mục tiêu trong runbook; chưa có restore drill. |

Lưu ý: Mức availability và budget phải được nhóm chốt sau khi đo và xác định cloud provider. Với cấu hình single-VM, không đặt tuyên bố HA đa vùng; mục tiêu availability chỉ áp dụng cho demo/staging có điều kiện vận hành rõ ràng.

## 4. Stakeholders, trách nhiệm và kỳ vọng

| **Stakeholder** | **Vai trò/quyền lợi** | **Nhu cầu chính** | **Vai trò review** |
| --- | --- | --- | --- |
| Customer | Người mua; chủ dữ liệu giỏ hàng/đơn hàng của mình. | Browse, giá đúng, đặt hàng, xem order, bảo mật thông tin. | Đại diện nhu cầu nghiệp vụ giả định; QA xác nhận user journey. |
| Store / Operations Staff | Nhân sự xử lý đơn, tồn, fulfillment. | Order status, stock, thao tác vận hành có phân quyền. | Review luồng fulfillment/tracking. |
| Administrator | Quản trị store và tài khoản vận hành. | Catalog, stock locations, product/price, order/admin control. | Phê duyệt chính sách nghiệp vụ giả định. |
| Product Owner / Team Lead | Chốt phạm vi và ưu tiên; trong đồ án do nhóm phân công. | Mốc giao hàng, đổi scope, nghiệm thu tính năng. | Owner tài liệu/decision register. |
| Backend / Commerce Engineers | Triển khai Medusa, payment, inventory, worker. | Đúng workflow/transaction, maintainability. | Review FR, BR, data ownership. |
| Frontend Engineers | Next.js và customer experience. | UI flows, API integration, error states. | Review journeys và UX acceptance. |
| Cloud / DevOps Engineers | Hạ tầng, deployment, logs, backup, CI/CD. | SLO, cost, deployment, operational safety. | Review NFR và vận hành. |
| QA / Test Owner | Thiết kế và lưu evidence. | Test cases có thể lặp lại, RTM rõ. | Chứng thực acceptance evidence. |
| Giảng viên / Hội đồng | Đánh giá đồ án và quyết định scope học thuật. | Business→Requirements→Workload→Architecture; trade-offs và evidence. | Nghiệm thu deliverables theo học phần. |

Các vai trò trong bảng là stakeholder roles, không gán danh tính cá nhân. Chưa có bằng chứng xác nhận chính thức của một doanh nghiệp khách hàng; các quyết định nghiệp vụ phải được review nội bộ/giảng viên trước khi đóng baseline.

## 5. High-level capabilities & business process

| **Capability** | **Business outcome** | **System of record** |
| --- | --- | --- |
| Identity & access | Khách hàng và nhân sự vận hành được xác thực, phân quyền. | Medusa Auth / Customer / Admin |
| Merchandising | Quản trị sản phẩm, biến thể, giá VND và tính hiển thị. | Medusa Product / Pricing / Sales Channel |
| Transaction | Cart → shipping → payment session → order, không tạo đơn sai. | Medusa Cart / Payment / Order |
| Inventory & fulfillment | Quản lý stock, reservation, shipping, order lifecycle. | Medusa Inventory / Fulfillment |
| Customer communication | Thông báo qua background worker, tách đường checkout. | Medusa event / notification extensions (planned) |
| Platform operations | CI/CD, logs, metrics, backup/restore, cost. | GitHub Actions / Compose / cloud tooling (target) |

Customer journey tham chiếu: đăng ký/đăng nhập (hoặc guest flow) → browse/search → chọn product/variant → cart → địa chỉ và shipping → chọn COD/simulator khi hợp lệ → hoàn tất cart → nhận Order ID → theo dõi order. Các phép tính tổng tiền, quyền truy cập và thay đổi inventory thuộc Medusa, không thuộc Next.js. [SRC-03, SRC-06]

## 6. Enterprise characteristics và architectural constraints

| **Đặc tính** | **Diễn giải cho MVP** | **Giới hạn có chủ đích** |
| --- | --- | --- |
| Consistency | Payment failure và Order/Inventory correctness phải kiểm thử; Medusa là commerce authority. | Không tự xây lại distributed transaction manager. |
| Scalability | Chia read-heavy browse và transactional checkout; đo k6 và bottleneck. | Không hứa autoscaling/HA khi chỉ có 1 VM. |
| Resilience | Async notification, fallback nơi phù hợp, restart, backup/restore. | Không bảo đảm zero downtime hay RPO=0. |
| Security | Server-side authz, secrets, PII, least privilege, TLS ở cloud. | Không claim chứng nhận PCI DSS hoặc ISO. |
| Auditability | Logs/test evidence/correlation, decision records. | Chỉ lưu dữ liệu cần thiết và có giới hạn retention. |
| Cost awareness | Cân nhắc VM/managed services theo ngân sách và workload thật. | Không áp đặt managed service nếu vượt ngân sách. |

## 7. Phạm vi dự án mức điều hành

| **MVP / Mandatory** | **Optional / Conditional** | **Out of Scope** |
| --- | --- | --- |
| Auth, product catalog, keyword search, PDP, variants | Advanced full-text search service nếu benchmark biện minh | Marketplace multi-seller, multi-tenant |
| Cart, checkout, order creation, order view | H&M Recommendation sau khi core ổn định | Real-money payment processing |
| COD / safe simulator ở non-production | Dashboards kinh doanh nâng cao | Full ERP/WMS/CRM |
| Inventory, payment failure/idempotency tests | Media CDN/multi-warehouse nếu được duyệt | Multi-region active-active |
| Async notification, cache/media architecture | ALS/BPR/LLM shopping assistant | Guaranteed HA/24×7 production SLA |
| Cloud staging, CI/CD, logs, monitoring, backup/restore | Auto scaling, managed DB theo chi phí | Public release of unlicensed H&M assets |

Bảng trên là scope cam kết theo yêu cầu học phần và plan, không phải danh sách các chức năng hiện đã hoàn thành. Chi tiết quy tắc, mốc và giả định nằm trong tài liệu Project Scope & Assumptions (PS-02).

## 8. Workload, constraints và giả định chính

| **Khía cạnh** | **Định nghĩa tạm thời / ràng buộc** |
| --- | --- |
| Business region | Vietnam, currency VND, một Sales Channel và một warehouse demo; không có yêu cầu nhiều quốc gia. |
| Traffic | Read-heavy browsing; workloads 30 RPS catalog và 3 RPS checkout từ k6 scripts là mục tiêu kiểm thử, không phải demand dự báo. |
| Deployment | Single cloud VM + Docker Compose/Caddy trong runbook; managed PostgreSQL là hướng mong muốn trong kế hoạch, phải quyết định bằng ADR/budget. |
| Payment | COD provider là mô phỏng phương thức thanh toán khi nhận; custom simulator only non-production, không thu tiền. |
| Data | PostgreSQL transactional store; Redis cache/event/workflows; media cần object storage hoặc chính sách assets rõ ràng. |
| Privacy | Không đưa secrets, customer tokens, dữ liệu cá nhân hoặc raw H&M dataset vào Git. |
| Resources | 5–7 sinh viên và lịch học có giới hạn theo brief; nhóm phải quyết định owners và capacity thực tế. |

## 9. Risks, mitigation và open decisions

| **Risk ID** | **Rủi ro / ảnh hưởng** | **Ứng phó & owner đề xuất** |
| --- | --- | --- |
| R-01 | Duplicate checkout / inventory oversell (cao). | Backend + QA: concurrency tests, reconciliation, idempotency ADR. |
| R-02 | PostgreSQL connection exhaustion đã từng thấy local (cao). | Backend/DevOps: pool sizing, connection monitoring, serialize import jobs. |
| R-03 | Notification provider lỗi (trung bình). | Backend: async retry/backoff, không rollback order; đo delivery. |
| R-04 | Môi trường single VM downtime/data loss (cao). | DevOps: backups, restore drill, readiness, publish RPO/RTO thực tế. |
| R-05 | Chưa có evidence cloud/metrics (cao với đánh giá). | QA/DevOps: staging, k6 report, dashboard snapshots và log links. |
| R-06 | Scope creep bởi recommendation / search engine (trung bình). | Product Owner: chỉ mở khi các Must-have và cloud gates hoàn thành. |
| R-07 | Quyền H&M CSV/ảnh chưa xác nhận cho public demo (cao). | Data owner: kiểm tra quyền; dùng placeholders/assets hợp pháp. |

Quyết định cần chốt trước baseline v1.0: ngân sách cloud/tháng, nơi triển khai staging, availability target, chính sách payment capture trong demo, notification adapter, object storage choice, acceptance của việc chỉ có một kho và scope Recommendation.

## 10. Milestone & governance theo Tuần 4–13

| **Mốc** | **Deliverable chính / entry-exit gate** |
| --- | --- |
| Tuần 4–6 | Baseline architecture, requirements v1, auth/catalog, checkout/order, integration tests. |
| Tuần 7 | Payment failure/success, duplicate/retry/idempotency và inventory consistency có evidence. |
| Tuần 8 | Domain events, worker notification/retry, order tracking, E2E xuyên async. |
| Tuần 9 | Cache/search architecture, media/object storage, test hit/miss/invalidation. |
| Tuần 10 | Cloud staging, CI/CD deployment, migrate/rollback, cloud E2E. |
| Tuần 11 | Security/access review, logs, metrics, alert và dashboard. |
| Tuần 12 | Workload/NFR report, peak test, failure/recovery, RPO/RTO và FinOps. |
| Tuần 13 | Feature freeze, traceability, evidence package, final report, slides và demo. |

## 11. Project success, acceptance và change control

Project được xem là đạt production-oriented MVP của học phần khi: (a) luồng mua hàng bắt buộc hoàn tất trên staging; (b) payment failure, duplicate order và inventory correctness có test evidence; (c) notification async, cache/media decisions và cloud deployment đã có xác minh; (d) security và observability tối thiểu được vận hành; (e) k6 và recovery có số đo; (f) mọi deviation từ scope được ghi vào change register. Đây là điều kiện target, chưa phải kết luận đạt.

Thay đổi scope phải ghi CR-ID, lý do, tác động business/FR/NFR, risk, effort, deadline, test, owner và người review. Chỉ phê duyệt thay đổi làm thay đổi “Must” sau khi đánh giá ảnh hưởng tới Tuần 13. Các requirement chưa được nghiệm thu phải đưa vào gap log thay vì xóa khỏi SRS.

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
