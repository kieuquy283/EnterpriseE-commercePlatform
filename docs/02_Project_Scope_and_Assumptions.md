# PROJECT SCOPE & ASSUMPTIONS

> **MVP boundary · MoSCoW · Deliverables · Dependencies · Change control**

**PHIÊN BẢN** 1.0 – Bản thảo hoàn chỉnh phục vụ review nhóm     **|     NGÀY**  02/11/2026

**HỆ THỐNG:** Enterprise E-commerce Platform · Medusa v2 / Next.js / PostgreSQL / Redis

**BASELINE CODE:** main d0bf45a; recommendation a98457c (đánh giá độc lập)

**TÌNH TRẠNG:** Chưa có xác nhận phê duyệt stakeholder; các mục tiêu đề xuất chưa phải số đo đã đạt.

> Tài liệu học thuật cho nhóm phát triển hệ thống bán lẻ giả định; không phải hợp đồng với doanh nghiệp thực tế.

## 1. Mục đích và nguyên tắc scope

Tài liệu PS-02 phân định rõ: những năng lực cần cung cấp trong production-oriented MVP của học phần, các hạng mục tùy chọn được cân nhắc sau khi core ổn định, và những gì không triển khai. Scope được xây dựng từ đề tài Enterprise E-commerce của giảng viên, kế hoạch Tuần 4–13, và source code đã kiểm tra. Không đánh đồng “Must-have” với “đã xong”. [SRC-01, SRC-02, SRC-03]

**Phân loại**  MUST: bắt buộc cho nghiệm thu; SHOULD: ưu tiên nếu các Must đạt, nhưng có thể chấp nhận giải pháp đơn giản tương đương qua ADR; COULD: optional; OUT: ngoài ranh giới. Tình trạng triển khai được theo dõi riêng.

## 2. Phạm vi sản phẩm và user journeys

Phạm vi khách hàng mục tiêu: một store bán lẻ Việt Nam, một sales channel, VND, một warehouse/stock location mẫu. Các actor chính là Customer, Store/Operations Staff và Administrator. Giao diện public là Next.js, Medusa xử lý auth, catalog, cart, payment, order và inventory. Không triển khai ERP hay multi-tenant system.

| **Journey** | **In-scope outcome** | **Giới hạn** |
| --- | --- | --- |
| J-01 Browse & choose | Trang sản phẩm, tìm kiếm từ khóa, variants, giá theo region và tình trạng mua được. | Full-text engine riêng không mặc định bắt buộc nếu search hiện tại đạt yêu cầu. |
| J-02 Purchase | Cart CRUD, shipping/address, COD hoặc simulator non-prod, complete cart thành Order. | Không xử lý tiền ngân hàng thật. |
| J-03 Post-purchase | Khách xem lịch sử/chi tiết/order status; staff thao tác theo quyền. | Không xây tracking của hãng vận chuyển bên ngoài. |
| J-04 Operations | Admin product/inventory/order; notification và operational metrics. | Không thay toàn bộ Medusa Admin. |

## 3. MVP Must-have scope

| **ID** | **Feature / capability** | **Acceptance boundary** | **Status tại baseline** |
| --- | --- | --- | --- |
| M-01 | Authentication & access | Register/login/logout; phân biệt customer/admin; không lộ đơn người khác. | Có code/test một phần. |
| M-02 | Catalog, PDP, variants | Published products; đúng price/region/channel; lựa chọn variant. | Có code/test. |
| M-03 | Search v1 | Keyword search có pagination; kiểm soát query input và trả empty state. | Có code; search service chưa có. |
| M-04 | Cart | Thêm, sửa lượng, xóa; tổng tiền do Medusa cung cấp. | Có code/test. |
| M-05 | Checkout | Địa chỉ, giao hàng, payment session, tạo Order và xác nhận. | Có code/test. |
| M-06 | Payment safety | Simulator success/failure trong dev; COD; duplicate/retry test, không order giả. | Success/fail có; idempotency gap. |
| M-07 | Inventory correctness | Reservation/availability không sai khi đặt/hủy đơn; chứng minh qua tests. | Có local evidence, thiếu cạnh tranh. |
| M-08 | Order tracking | Customer order history/detail và status; operations flow. | Có history/detail; tracking toàn bộ cần review. |
| M-09 | Async notifications | Order event → worker → email adapter, retry & failure isolation. | Redis/worker có; app notification chưa có. |
| M-10 | Cache / search / media architecture | Cache strategy/invalidation; product search; object storage cho media thử nghiệm có quyền sử dụng. | Redis cấu hình; S3 optional, thiếu evidence. |
| M-11 | Cloud + CI/CD | Staging cloud chạy HTTPS; CI/CD và migration/release/rollback. | CI pass; staging/CD chưa xác minh. |
| M-12 | Security & operations | Authz, secrets, logs, metrics, dashboard, alert. | Một phần. |
| M-13 | NFR & resilience | k6, failure recovery, backup/restore, RPO/RTO, FinOps report. | Scripts/runbook; test reports chưa có. |

## 4. Optional / conditional scope

| **ID** | **Hạng mục** | **Điều kiện được phép triển khai** |
| --- | --- | --- |
| O-01 | H&M dataset ETL và catalog mở rộng | Chứng minh quyền sử dụng/asset policy; không ảnh hưởng purchase tests và database resource. |
| O-02 | Popularity/content/item-CF/hybrid recommendation | Đóng các Must thiếu trước; có offline quality baseline và candidate filtering. |
| O-03 | Dedicated search engine (Meilisearch/khác) | ADR chứng minh current search không đạt feature/performance acceptance. |
| O-04 | Advanced dashboard và personalized ranking | Có use case/metrics, không kéo theo data/privacy risk vượt ngân sách. |
| O-05 | Managed PostgreSQL / CDN và media optimizations | Cost/security/ops ADR; không được tự động claim đã triển khai. |
| O-06 | Autoscaling hoặc load-balanced API replicas | Chỉ sau khi có benchmark và nhu cầu thực tế. |

## 5. Out-of-scope

- Thanh toán có tiền thật, lưu thẻ, PCI certification; production payment simulator bị cấm.
- Marketplace đa nhà bán, đa tenant, bán xuyên nhiều region/currency; ERP/WMS/CRM full-scale.
- Hệ thống giao vận tuyến cuối, định vị tài xế, đối soát thu tiền COD ngoài đời thật.
- Microservice decomposition quy mô lớn, Kafka/Kubernetes bắt buộc, active-active multi-region, SLA thương mại 24×7.
- Dùng raw H&M purchases làm “đơn hàng thực” của Medusa hoặc xuất bản ảnh/dataset chưa có quyền.
- Chứng nhận compliance/penetration testing chuyên sâu thay cho bài học thuật.

## 6. System, organizational và data boundary

| **Boundary** | **Bên trong dự án** | **Bên ngoài / external** |
| --- | --- | --- |
| UI | Next.js rendering, interaction, form validation, cookies. | Không trực tiếp sửa commerce DB. |
| Commerce | Medusa product/variant/pricing/cart/order/payment/inventory. | Không viết lại Medusa core hoặc SQL insert core tables. |
| Operations | GitHub Actions, Compose, logging/metrics, backup & recovery runbook. | Quyền hạ tầng do cloud provider quản lý theo shared responsibility. |
| Notification | Subscriber/workflow/event, adapter email sandbox. | Sự sẵn có của email provider là external dependency. |
| Media | Metadata & URL trong Medusa, object storage/file provider. | Không nhúng ảnh chưa được cấp phép vào public site. |
| ML optional | Offline ETL/model artifacts, Medusa ID mapping. | Không trộn historical H&M events với project-real customers/orders. |

## 7. Work products và exit criteria

| **Deliverable** | **Owner gợi ý** | **Acceptance / bằng chứng** |
| --- | --- | --- |
| Project Definition + SRS + Scope | Team Lead / BA | Review requirement IDs, scope và open decisions. |
| Architecture diagrams + ADRs | Architect / Backend / DevOps | Khớp code, trade-offs, flow sync/async và data ownership. |
| Medusa commerce MVP | Backend + Frontend | End-to-end purchase trên staging, negative paths có evidence. |
| Payment & inventory correctness report | Backend + QA | Duplicate/retry/failed payment, concurrent stock test với readback. |
| Async notification flow | Backend + DevOps | Event published, worker processed/retried, order unaffected on failure. |
| Cache / search / media decision | Backend + DevOps | ADR + cache hit/miss/invalidation, media URL demo hợp lệ. |
| Cloud release + CI/CD + migration | DevOps | Working HTTPS URL, run log, migration/release/rollback drill. |
| Security and observability pack | QA + DevOps | Checklist/authz negative tests, dashboard/alert snapshots. |
| NFR/DR/FinOps evidence | QA + DevOps | k6 profiles, p95/errors, recovery and cost report. |
| Demo/report pack | All | RTM, logs, screenshots, demo script, submission checklist. |

## 8. Scope timeline theo Tuần 4–13

| **Tuần** | **Phạm vi bắt buộc** | **Exit gate** |
| --- | --- | --- |
| 4 | Architecture baseline, source-of-truth, backlog, requirements | Boundary và ADR ban đầu reviewed. |
| 5 | Authentication, catalog, variants, search | FR-AUTH/CAT verification + ERD. |
| 6 | Cart, checkout, order | Complete-order positive test và sequence. |
| 7 | Payment, duplicate request, inventory | Success/failure/retry/concurrency evidence. |
| 8 | Events, worker, notification, tracking | Async test không làm mất Order. |
| 9 | Cache, search, object storage/media | Cache correctness, asset/media flow. |
| 10 | Cloud staging, CI/CD, rollback | Cloud E2E + release run. |
| 11 | Access, security, logging, metrics | Dashboard + security review. |
| 12 | Load/recovery/cost | NFR report + restore exercise. |
| 13 | Freeze, gap resolution, final demo | RTM closed or deviations justified. |

## 9. Assumption register và phương pháp xác minh

| **ID** | **Giả định / tình trạng** | **Cách xác minh & owner** |
| --- | --- | --- |
| A-01 | Doanh nghiệp và lượng giao dịch chỉ là scenario học thuật, không có real sales baseline. | Team Lead: công bố giả định trong báo cáo. |
| A-02 | Một region Việt Nam, VND, một kho đáp ứng use case bắt buộc. | Backend/Product Owner: review with instructor. |
| A-03 | Một VM chạy đủ demo ban đầu; không có HA đa vùng. | DevOps: benchmark CPU/RAM/IO và cost. |
| A-04 | Catalog 30 RPS / checkout 3 RPS là workload kiểm thử, không phải forecast. | QA: chốt workload model, phân biệt stress vs baseline. |
| A-05 | Manual COD và simulator chỉ mô phỏng auth; không có settlement thật. | Backend/QA: validate provider & documentation. |
| A-06 | Cấu hình Redis/worker đủ làm nền cho async extensions. | Backend: xây subscriber và test dependency failure. |
| A-07 | RPO≤60m và RTO≤120m là mục tiêu từ runbook, chưa đo. | DevOps: backup policy và restore drill. |
| A-08 | Chi phí cloud sẽ trong trần ngân sách do nhóm phê duyệt; chưa chốt con số. | Owner/DevOps: ghi budget trước khi deploy. |
| A-09 | Dữ liệu H&M và ảnh chỉ dùng trong phạm vi được phép. | Data owner: xác minh Kaggle competition rules/asset rights. |
| A-10 | E2E Playwright trên recommendation chưa nằm trên main, dữ liệu pilot chưa kiểm đếm lại DB ở phiên hiện tại. | QA: integrate tests/re-read DB, ghi evidence. |

## 10. Constraints, dependencies và các quyết định mở

| **Mã** | **Ràng buộc / quyết định** | **Hệ quả** |
| --- | --- | --- |
| C-01 | Deadline Tuần 13 và nhóm 5–7 theo brief; nguồn lực hữu hạn. | Chọn vertical slice; optional không được làm trễ core. |
| C-02 | Medusa 2.21.2, Node/npm trong repo; không fork core. | Dùng supported APIs/workflows, version-lock tests. |
| C-03 | PostgreSQL từng gặp quá giới hạn connection local. | Import batch serial; giám sát pool trước scale. |
| D-01 | Chọn cloud provider và có cần managed DB. | Open: owner DevOps + team lead; budget ADR. |
| D-02 | Chọn sandbox email provider/log sink. | Open: đảm bảo async demo + retry evidence. |
| D-03 | Chọn object storage cho product images. | Open: data rights, bucket policy, CDN tradeoff. |
| D-04 | Chọn availability target và window đo. | Open: single VM không mặc định HA. |

## 11. Milestone acceptance và non-acceptance

Mỗi milestone chỉ được đánh dấu Accepted nếu có (1) artifact trong Git ở commit xác định, (2) test/run log hoặc demo evidence với môi trường/dữ liệu/timestamp, (3) pass acceptance criteria và (4) owner review. Các trạng thái cần dùng: Not Started, In Progress, Implemented–Unverified, Verified in Local, Verified in Staging, Accepted, Deferred/Out-of-Scope.

| **Gate** | **Chấp nhận khi** | **Không được tính là đạt chỉ vì** |
| --- | --- | --- |
| G-1 Core | Auth/catalog/cart/checkout/order tích hợp E2E staging. | Có API route mà chưa chạy end-to-end. |
| G-2 Correctness | Negative/failure/retry/concurrency tests + DB readback. | Chỉ có một happy-path hoặc unit test. |
| G-3 Cloud | HTTPS URL, pipeline deploy log, migration, rollback rehearsal. | Có Dockerfiles hoặc runbook. |
| G-4 NFR | k6 report, p95/errors, resource metrics, restore drill, cost. | Có ngưỡng thresholds trong source. |
| G-5 Final | RTM, security report, demo script, gap approval. | Slide nói “production-ready” không kèm evidence. |

## 12. Change control và rollback scope

Mọi change request cần: CR-ID; requirement liên quan; loại (add/change/defer); lý do; tác động use case/data/NFR/security/cost; độ ưu tiên; effort; ảnh hưởng milestone; người phê duyệt; kế hoạch kiểm thử và rollback. Không loại bỏ Must-have bằng cách đổi tên thành Optional nếu chưa có quyết định được ghi nhận.

Triển khai rollback bằng rollback code/config và migration backward-compatible; không xóa database hay xóa commerce data để “trả lại trạng thái sạch”. Tình huống import catalog/đặt đơn thử phải dùng fixture riêng hoặc unpublish có kiểm soát. Không chạy docker compose down -v trên database chứa dữ liệu cần giữ.

## 13. Ghi nhận thực tế hiện có và deferred backlog

| **Đã xác nhận qua source/evidence** | **Cần làm tiếp** |
| --- | --- |
| Backend + Storefront và docker compose đã có; CI/API tests gần nhất pass. | Staging deployment/release, dashboard, recovery evidence. |
| Provider simulator success/failure có trên main; basic checkout test. | Duplicate/retry idempotency, inventory concurrent safety. |
| Redis/worker được cấu hình. | Custom notification adapter, retry, event schema. |
| H&M pilot được README ghi nhận 500 products/1.874 variants. | Không mở rộng 5k–10k trước quality/rights/resource gates. |
| Playwright E2E có trên recommendation. | Đồng bộ vào branch xuất phát từ main, chạy CI và lưu artifacts. |

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
