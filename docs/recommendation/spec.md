# Recommendation MVP — Functional & Technical Specification

> **Document ID:** REC-SPEC · **Version:** 1.1 · **Status:** IMPLEMENTED cho private pilot; kết quả nghiệm thu trong [reports](reports/final_implementation_report.md). Public NO-GO.
> **Owner:** Data/Recommendation lead; reviewed by Backend, Frontend, QA/DevOps.
> **Plan:** [plan.md](plan.md) · **Parent:** [SRS](../03_Software_Requirements_Specification.md) `FR-REC-01/02` (COULD).
> **Scope:** Non-personalized **Popularity (Home)** + **Metadata Similarity (PDP)** only.

## 1. Mục đích và ranh giới

Đặt contract để mọi thành viên và Codex có thể phát triển độc lập mà vẫn trả cùng kết quả: Python tính các ứng viên offline → Medusa quản lý version và kiểm tra khả năng mua → Next.js hiển thị. **Không có `customer_id`, không có huấn luyện online, không tích hợp Cart/Checkout/Order, không dùng dữ liệu giao dịch H&M như đơn bán hàng trên Medusa.**

### In scope

| Placement | Context | Số thẻ mục tiêu | Thuật toán | Fallback |
|---|---|---:|---|---|
| `home` | `home` + region/sales channel | 12 | Historical purchase popularity, tổng theo Medusa Product | Published catalog deterministic, nhãn `Featured products` nếu không có popularity đủ tốt |
| `product_detail` | `product:<product_id>` | Tối đa 6 | Metadata weighted similarity (content based) | Popular trong cùng nhóm sản phẩm, sau đó catalog hợp lệ |

**Ngoài scope:** collaborative filtering, user embeddings, personalized home, cart rail, frequently bought together, promotion ranking, LLM, real-time inventory ML. **Không thể suy CTR/conversion thực** từ H&M CSV không có impression/click của website.

## 2. Required decisions và baseline

| ID | Quyết định | Default đến khi được review |
|---|---|---|
| DEC-01 | Repo source | Khóa commit cụ thể trước Phase 01; remote `main` và `recommendation` đang diverged tại lần audit 2026-11-04. |
| DEC-02 | Data rights | Không public raw data/ảnh/candidate-derived assets trước khi điều khoản/permissions được ghi lại. |
| DEC-03 | Catalog | Đánh giá 500 Medusa Products được báo cáo trước; chỉ mở rộng 1k/5k/10k khi coverage/QA có lý do. |
| DEC-04 | Candidate persistence | Medusa custom module + PostgreSQL, Redis optional cache. Cần kiểm tra Medusa 2.21.2 API/migrations trước khi viết. |
| DEC-05 | Similar weights | Theo mục 5; đây là baseline đề xuất, phải so với exact-category match. |
| DEC-06 | Data split | Train/validation/test theo thời gian, cutoff được chọn sau profiling và ghi trong report; không dùng dữ liệu tương lai ở train. |
| DEC-07 | Release scope | Optional, chỉ GO khi core commerce ổn định và quyền demo phù hợp. |

## 3. Requirement IDs & acceptance contract

| ID | Priority | Requirement | Verification |
|---|---|---|---|
| REC-FR-01 | COULD | Homepage có thể hiển thị tối đa 12 sản phẩm Popularity cho region hiện tại; không yêu cầu login. | Browser test, đúng product ID/price/region, fallback label. |
| REC-FR-02 | COULD | PDP hiển thị tối đa 6 Similar Products, loại chính product đang xem, không duplicate. | E2E trên nhiều Product contexts, không tự gợi ý self. |
| REC-DATA-01 | MUST within optional feature | `article_id` giữ số 0 đầu, mapping unique tới đúng Medusa Variant/Product; import pilot được đối soát DB. | Coverage & DB readback report, failing tests cho duplicate/missing. |
| REC-DATA-02 | MUST within optional feature | H&M raw transactions không được nhập thành Orders; synthetic commerce price/stock ghi provenance. | Code audit + manifest checks. |
| REC-DATA-03 | MUST within optional feature | Input/output có checksums, selection version, timestamps, config; raw H&M/customer hashes không được commit. | Artifact schemas + `.gitignore`/secret checks. |
| REC-DATA-04 | MUST within optional feature | Public demo tuân thủ quyền dữ liệu/ảnh; metadata và product visuals có nguồn hợp lệ. | Rights decision + media review. |
| REC-ALG-01 | MUST within optional feature | Popularity tính từ counts theo article, gộp cùng Medusa Product, tie-break deterministic, train-only evaluation. | Golden test, repeat-run SHA, leakage test. |
| REC-ALG-02 | MUST within optional feature | Similarity theo metadata trên cùng catalog, có rule missing fields/taxonomy, không tính self, chỉ giữ top candidates. | Unit tests + manual relevance evaluation. |
| REC-API-01 | MUST within optional feature | API có 2 placements, validates query, hard limit 24, không nhận customer_id. | HTTP tests 200/400/404 và auth/sales-channel tests. |
| REC-API-02 | MUST within optional feature | API chỉ trả Medusa products hợp lệ cho region/channel/price/status và purchasability theo quy tắc Medusa. | Product unpublished/out-of-channel/out-of-stock/backorder cases. |
| REC-API-03 | MUST within optional feature | Dedupe + deterministic fallback; 200 với [] nếu không có product hợp lệ. | Missing candidates and empty catalog tests. |
| REC-API-04 | MUST within optional feature | Candidate version được publish idempotently và activate atomically; rollback không ảnh hưởng product/order. | Double import, partial failure, activation/rollback tests. |
| REC-API-05 | MUST within optional feature | Redis failure không làm corrupt data; checkout độc lập với recommendation. | Failure injection + checkout regression. |
| REC-NFR-01 | TARGET | Đo warm/cold p95, errors tại 30 RPS trên staging profile đã ghi. | k6 result, CPU/RAM/DB connections; ngưỡng đề xuất warm <250ms, cold <800ms. |
| REC-NFR-02 | MUST within optional feature | Offline jobs và publish bounded-memory/concurrency, không gây PostgreSQL connection exhaustion. | Profiling metrics, zero SQLSTATE 53300 ở workload thử. |
| REC-NFR-03 | MUST within optional feature | API không N+1 fetch 100 products; bounded candidate pool và timeout. | Instrumented test/query count. |
| REC-NFR-04 | MUST within optional feature | Feature flag tắt gợi ý thì UI trở về behavior hiện tại, core checkout không đổi. | E2E flag-off/regression. |
| REC-NFR-05 | MUST within optional feature | Không xuất PII, customer hash, raw scores hay H&M IDs ở public API/logs. | Response contract + redacted log review. |

`MUST within optional feature` chỉ áp dụng **nếu nhóm quyết định triển khai Recommendation**; không biến Recommendation thành nhiệm vụ bắt buộc của đồ án chính.

## 4. ETL, mapping và candidate artifact contracts

### 4.1. Input & ID rules

- Input offline: `data/hm/articles.csv` và `data/hm/transactions_train.csv`; `customers.csv` **không bắt buộc** cho Popularity/Similarity.
- Product identity: current importer nhóm theo `product_code + product_type + product_group + department + section`; **một Product có nhiều H&M article variants**. Không đổi thành `1 article = 1 Product` nếu chưa có migration/decision vì sẽ làm lệch catalog hiện tại.
- `article_id` là **string**, giữ số 0 đầu; one-to-one tới SKU `HM-{article_id}` / Medusa Variant ID; many-to-one từ articles tới Medusa Product ID.
- Mapping phải được đối soát **trực tiếp từ Medusa/PostgreSQL đang được chọn làm target**, không tin hoàn toàn `medusa-mapping.jsonl` sinh local.
- Chọn catalog theo thống kê **train-only**, diversity và ảnh hợp pháp; nếu vẫn giữ 500 nhóm theo thứ tự cũ, báo rõ sampling bias, không dùng validation/test để lựa chọn popular products.

### 4.2. Versioned candidate JSONL — schema đề xuất

```json
{"version":"rec-YYYYMMDD-01","placement":"home","context_key":"home","target_product_id":"prod_...","score":120,"rank":1,"strategy":"hm_purchase_popularity"}
```

```json
{"version":"rec-YYYYMMDD-01","placement":"product_detail","context_key":"product:prod_...","target_product_id":"prod_...","score":0.85,"rank":1,"strategy":"hm_metadata_similarity"}
```

Trường được yêu cầu: `version`, `placement`, `context_key`, `target_product_id`, `score`, `rank`, `strategy`. Metadata của run gồm `source_hashes`, `catalog_hash`, `mapping_hash`, `selection_rule`, `train_cutoff`, `config_hash`, `generated_at`, `generator_commit`. Tất cả artifact dưới `data/hm/processed/` bị Git ignore; metadata/report đã scrub có thể được ghi dưới `docs/recommendation/evidence/`.

### 4.3. Offline invariants

- Không có product ID trùng trong cùng một context và version; rank bắt đầu từ 1, duy nhất, sắp theo score giảm dần + ID ổn định khi hòa.
- Không tự gợi ý chính context product; không cần lưu lặp 100 candidate khi thực tế có ít hơn.
- Mọi product IDs trong candidates đã được kiểm tra có trong catalog/mapping tại thời điểm build; **API vẫn phải revalidate trạng thái bán** tại thời điểm request.
- Không commit full transaction history, customer hashes, customer emails, H&M images, HMAC key hoặc các tệp bản quyền hạn chế.

## 5. Algorithms

### 5.1. Popularity

1. Stream `transactions_train.csv` và đếm `article_id` chỉ thuộc tập catalog đã chọn; mapping article → Medusa Product; **cộng số lượt mua của tất cả variants** cho mỗi Product.
2. Train-only counts cho evaluation; sau khi chốt evaluation, có thể fit lại serving counts từ phạm vi lịch sử được phép sử dụng, ghi rõ `training_window`/cutoff.
3. Tie-break theo Medusa Product ID; không dựa vào giá VND giả lập hoặc xu hướng bán hiện nay.
4. Sinh tối đa 100 candidates cho `home`; thiếu lịch sử → deterministic fallback Medusa catalog, nhãn chính xác `Featured Products` thay vì `Trending now`.

**Không cần HMAC customer IDs** chỉ để tính aggregate counts. Nếu offline Recall/MAP theo từng customer được chấp thuận, tạo pseudonymous IDs bằng secret HMAC local riêng; không xuất IDs đó sang online API.

### 5.2. Similar Products

Feature baseline đề xuất (tổng 100%):

| Attribute | Weight |
|---|---:|
| `product_type` | 0.30 |
| `product_group` | 0.20 |
| `section` | 0.15 |
| `department` | 0.10 |
| `garment_group` | 0.10 |
| Color set overlap | 0.05 |
| Description token overlap | 0.10 |

- `index_group` dùng như **candidate blocking/guardrail**, không cộng thêm vào tổng tránh double count.
- Missing values: chỉ tính điểm trên feature có dữ liệu **ở cả hai Products**, chuẩn hóa theo **tổng trọng số feature khả dụng**, nhưng yêu cầu ít nhất một taxonomy match; ghi cả `matched_features`/`eligible_weight` để tránh một feature đơn lẻ bị điểm 1.0 gây sai lệch.
- Hạn chế candidate search trong cùng `index_group` và ưu tiên cùng `product_group`/`product_type`; nếu thiếu có thể mở rộng có kiểm soát. Không so N² toàn catalog khi tăng 5k–10k.
- Ngưỡng `min_score` hiện là 0.70 sau agent metadata validation cho private pilot; chưa phải human relevance validation hoặc ngưỡng tối ưu. Ứng viên không qua ngưỡng dùng fallback khác chiến lược. [ADR](adr-private-validation.md).
- Unit tests: missing features, color variants, self exclusion, deterministic tie, cross index group, 0 neighbors, source conflict.
- So với baseline **Exact Category Match**, đánh giá ít nhất 20 Product contexts đại diện (nếu dữ liệu phù hợp); ghi nhận đánh giá chủ quan/giới hạn không có ảnh.

## 6. Storage and publish contract

**Đề xuất custom Medusa module** `apps/backend/src/modules/recommendation/`, dùng data models/migration riêng của module (không sửa bảng core Medusa):

| Model | Trường tối thiểu | Invariant/index |
|---|---|---|
| `recommendation_run` | `id`, `version`, `status` (`staging`, `ready`, `failed`), `checksum`, `manifest`, ORM timestamps | unique version; ready run immutable |
| `recommendation_candidate` | `id`, `run_id`, `placement`, `context_key`, `target_product_id`, `score`, `rank`, `strategy` | unique `(run_id,placement,context_key,target_product_id)` và `(run_id,placement,context_key,rank)`; index `(run_id,placement,context_key,rank)` |
| `recommendation_active` | singleton `id`, `run_id`, ORM timestamps | một row `recommendation_active`; cập nhật một statement để activate/rollback ready run |

**Activation:** load toàn bộ candidates vào run `staging`, validate row counts/uniqueness, rồi **chuyển active pointer trong một transaction/consistency boundary có kiểm chứng**. Một request luôn dùng một `run_id` được xác định đầu request. Khi publishing thất bại, run cũ vẫn active; rollback là chọn lại run cũ, không xóa products hoặc DB volumes. Cách tổ chức pointer/unique-active constraint là chi tiết triển khai cần xác nhận với Medusa 2.21.2 trước migration, không giả định `status` đơn thuần bảo đảm atomicity.

**Cache thực tế:** candidate/version đọc từ PostgreSQL ở mỗi request, không có custom candidate cache. Redis qua modules Medusa. Native product validation có in-flight coalescing theo publishable key/region/locale/query cho anonymous requests, xóa Promise ngay sau khi xong/lỗi; không cache kết quả giá/stock đã hoàn tất. Cookie/token/identity không dùng coalescing. Nếu bổ sung candidate cache sau này, phải có active run/context/region/channel trong key. [ADR](adr-private-validation.md).

## 7. Store Recommendation API contract (proposed)

### 7.1. Request

```http
GET /store/recommendations?placement=home&region_id=reg_...&limit=12
GET /store/recommendations?placement=product_detail&product_id=prod_...&region_id=reg_...&limit=6
```

- `placement`: required, enum `home`/`product_detail`.
- `product_id`: required for PDP; no `customer_id` query (reject unknown sensitive input).
- `region_id`: required, resolve against Medusa region and configured sales channel using Store API/publishable key context; do not trust region ID alone for authorization.
- `limit`: optional, defaults 12/6; integer range 1..24; candidate scan hard cap 100.
- Query context must use the Store API's existing publishable-key/auth conventions; no independent customer identity store.

### 7.2. Response example (illustrative, NOT actual output)

```json
{
  "placement": "product_detail",
  "strategy": "hm_metadata_similarity",
  "version": "rec-YYYYMMDD-01",
  "fallback_reason": null,
  "products": [{"id": "prod_...", "title": "Example", "handle": "example", "variants": []}]
}
```

`products` must be **validated/normalized Medusa StoreProduct-compatible payloads** returned via Medusa product/pricing/query machinery; not fabricated JSON with missing price context. Exact projection is finalized with the existing `ProductPreview` props during Phase 05. No raw H&M article ID or internal scores.

### 7.3. Behavior/error matrix

| Case | Expected |
|---|---|
| Valid request + candidates | `200`, sorted unique products, max `limit` |
| Invalid placement/limit/product_id/region format | `400`, safe validation message |
| PDP target product ID not found/not in saleable catalog | `404` (or project's established not-found behavior, documented/tested) |
| No valid candidate | `200`, `products: []` or deterministic safe fallback if products exist |
| Candidate store missing/unpublished but Medusa catalog healthy | `200` with catalog fallback + reason; **never fake popularity label** |
| Redis unavailable, DB healthy | Read from PostgreSQL, no order/checkout effect |
| Medusa commerce DB/API unavailable | Fail safely with `5xx`/existing page fallback; do **not** claim recommendations remain available |
| Product unpublished, wrong sales channel/region, wrong price, unpurchasable | Filter out; fill from fallback if possible |

**Performance:** resolve candidates in batch and preserve candidate ordering after Medusa filtering. Never perform `getProduct` for each of 100 candidates. Backorder and inventory policy must follow Medusa's **actual purchasability rules**, not a handmade `stock > 0` check.

## 8. Frontend contract

- `apps/storefront/src/lib/data/recommendations.ts` is the single data-access adapter, using established server-side Medusa SDK and current region/publishable context.
- Home: section with up to 12 validated products and a label matching strategy; no auth required.
- PDP: reuse `RelatedProducts`/`ProductPreview`/skeleton as feasible; up to 6, exclude current Product and duplicates.
- Handle loading/empty/error, mobile, correct localized price and image placeholder. Feature flag e.g. `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS` (name is proposed, set only after reviewing project conventions); **flag off restores existing behavior**.
- Request timeout must not block Storefront purchase journey; never call recommendation from checkout, cart completion or order creation.

## 9. Evaluation & operational requirements

| Dimension | Mandatory evidence if feature implemented | Limitations |
|---|---|---|
| Data | Article/variant/product coverage, zero-history rate, category distribution, mapping errors, checksums | Local pilot counts must be confirmed against target DB |
| Popularity | Time-split train-only Recall@12 and optional MAP@12 at **declared evaluation unit**, coverage; baseline comparison | H&M official MAP@12 is article-per-customer; product-level aggregated score is **not directly comparable** |
| Similarity | Top-6 relevance spot-check/annotated contexts; duplicates/self/missing-feature coverage; Exact Category baseline | Metadata similarity ≠ visual similarity or user purchase affinity |
| API | Positive/negative HTTP tests, filtered-out candidates, Redis failure, candidate store fallback, active version switch | Fallback depends on Medusa catalog still being usable |
| Performance | k6 30 RPS on declared VM/catalog, warm/cold p50/p95/p99, errors, DB connections, cache hit/miss | Targets are **proposed**, not measured |
| Reliability | Failed publish leaves old active; rollback; UI flag off; core checkout regression | No HA guarantee for single VM |
| Security/rights | No PII or raw H&M in public API/log/Git; documented data rights | Rights decision is required before public deployment |

**Latency targets (proposal):** warm p95 < 250ms, cold p95 < 800ms at 30 RPS, error rate <1%, measured with a fixed test profile; adapt to real VM budget and record deviations. No false claim of an achieved SLO.

## 10. Phase traceability

| Spec area | Phase | Files planned |
|---|---|---|
| DEC baseline/rights | [00](phase_00_baseline_rights.md) | `docs/recommendation/phase_00...`, future rights decision in same folder |
| Data contract/coverage | [01](phase_01_data_readiness.md) | `scripts/hm/profile-interactions.py`, optional selection/mapping validation |
| Popularity | [02](phase_02_popularity_offline.md) | `scripts/hm/build-popularity-candidates.py`, tests, train-only counts |
| Similarity | [03](phase_03_similarity_offline.md) | `scripts/hm/build-similar-candidates.py`, tests |
| Versioning/data models | [04](phase_04_candidate_publishing.md) | `apps/backend/src/modules/recommendation/`, publish script |
| REST/Store API | [05](phase_05_serving_api.md) | `apps/backend/src/api/store/recommendations/route.ts`, HTTP tests |
| Home/PDP | [06](phase_06_storefront.md) | `apps/storefront/src/lib/data/recommendations.ts`, UI + E2E |
| Final metrics/release | [07](phase_07_evaluation_release.md) | `load/recommendations.js`, reports under `docs/recommendation/evidence/` |

## 11. Out-of-scope, open issues and change control

- Open: exact Medusa 2.21.2 query mechanics for region/price, run-activation constraint, H&M data rights, actual coverage, staging performance. Phase owners resolve with tests; do not assume.
- Docs created by this work only under `docs/recommendation/`. Historical source docs stay in their existing locations and are linked, not silently relocated.
- Any change to query schema, ranking behavior, catalog selection or requirement priority requires updating `spec.md`, affected `phase_*.md`, tests and PR description.
- **Feature freeze:** after Phase 07 GO decision. Optional scope stays OFF if license/mapping/safety/evidence gate fails.

### Contract đã chốt khi triển khai

- Private technical gate dùng agent review 20 contexts; human review vẫn NOT_RUN và bắt buộc trước tuyên bố human relevance/public release. Không thay đổi nhãn trong artifacts thành human reviewed.
- API nhận limit 1..24 nhưng Home luôn <=12/PDP <=6. Unknown region trả 400; target không bán được trả 404; overload/dependency timeout trả 503. Frontdoor test Caddy trả 504 sau 5 giây nếu mắc ở middleware Medusa trước route.
- Tối đa 100 candidates/context; resolve bằng batch và chỉ trả variants có giá/purchasability để giá thấp nhất trên card không đến từ variant không mua được. Không lộ metadata/SKU/article options/scores.
- Fallback PDP: candidates → popular ưu tiên cùng nhóm → global popular → catalog; label đổi khi có fallback. Cả frontend/backend flags mặc định OFF trong deployment chính.
- Run manifest lưu source/config qua hashes và generator source hash; ngày tạo/đổi ở ORM run timestamps và reports. Candidate bytes có repeat SHA evidence riêng. Không thêm timestamp biến động vào ranked files để giữ determinism.
- CI chạy Python fixture tests và backend unit/HTTP tests; chưa có GitHub run cho thay đổi chưa commit. Browser/load tests đã chạy local theo reports.

## Execution clarifications — 2026-11-04

- Actual local article IDs: ten-digit strings, preserve leading zero; sửa giả định nine-digit trong Phase 01.
- Private offline pipeline hiện dùng `scripts/hm/build-mvp-candidates.py`; legacy popularity script giữ nguyên. Cutoffs: train <=2020-09-08; validation 09-09..15; test 09-16..22. Candidate serving được fit từ toàn lịch sử sau khi tách evaluation; không dùng serving ranking để báo điểm test.
- Metric thực thi là micro recall@12 theo purchase event tại cấp Medusa Product, có baseline catalog-order. Không gọi đây là customer MAP@12; chưa lưu customer IDs để tính MAP.
- Similarity có thêm minimum eligible feature weight 0.50 để tránh điểm cao từ quá ít thông tin. Threshold 0.50 hiện là thử nghiệm, chưa qua human validation; chưa được phép publish.
- Quy trình review: [similarity-review-protocol.md](similarity-review-protocol.md). API/UI contracts vẫn PROPOSED cho đến khi có phase reports PASS tương ứng.
