# Hybrid Recommendation v2 — đặc tả thực thi

**Trạng thái:** contract v2; triển khai code đang PARTIAL, xem [system report](reports/system_test_report.md). **Baseline:** `recommendation-pdp` tại `cf16e0ba2e2af3519f79f5d1b516708d64a28605` (07/11/2026). V2 chỉ nâng Similar Products trên PDP; Home Popularity tiếp tục dùng contract hiện tại. Các chữ MUST dưới đây chỉ có hiệu lực nếu nhóm chọn triển khai phần mở rộng v2, không biến Recommendation thành điều kiện của checkout.

## Ranh giới

Offline Python đọc catalog, mapping và ảnh H&M được phép dùng; tạo feature và candidate artifacts có version/checksum dưới `data/hm/processed/` (gitignored). Medusa Recommendation module nhận bản candidate đã kiểm, lưu run bất biến và active pointer trong PostgreSQL. Store API đọc tối đa 100 ứng viên/context, kiểm tra lại bằng Store Product pipeline của Medusa theo publishable key, region, channel, giá, stock/backorder. Next.js chỉ hiển thị tối đa 6. Không tính embedding trong HTTP request, không lưu customer identity trong v2, không viết lại commerce core.

## Yêu cầu chức năng

| ID | Mức | Điều kiện có thể kiểm thử |
|---|---|---|
| HYB-FR-01 | P0 | PDP nhận 0–6 Product khác chính nó, không lặp, giữ rank của ứng viên hợp lệ; thiếu ứng viên có thể trả ít hơn 6. |
| HYB-FR-02 | P0 | Product cards dùng ảnh của đúng Medusa Product và giá/region Medusa; ảnh thiếu dùng placeholder. |
| HYB-FR-03 | P0 | API lỗi/timeout/flag OFF không chặn PDP, Cart, Checkout; dùng legacy related-products hoặc ẩn rail; nhãn không gọi fallback catalog là similarity. |
| HYB-FR-04 | P0 | Home Popularity hiện tại giữ nguyên contract và kết quả khi v2 được bật/tắt. |
| HYB-FR-05 | P1 | Giao diện 360px, keyboard, heading/section và trạng thái loading/empty/error được kiểm bằng Playwright; rail không làm tràn trang. |
| HYB-FR-06 | P2 | Session personalization chỉ sau v2, cần yêu cầu và notice/consent riêng; không nhập `customer_id` từ client. |

## Dữ liệu và nguồn gốc

| ID | Mức | Điều kiện có thể kiểm thử |
|---|---|---|
| HYB-DATA-01 | P0 | `article_id` là string 10 chữ số, giữ số 0 đầu; map article → Variant SKU `HM-{article_id}` → Product qua mapping được đối chiếu với DB đích. Một Product có thể có nhiều articles. |
| HYB-DATA-02 | P0 | Chỉ lấy ảnh đúng article thuộc Product đó. Thiếu/ảnh lỗi → metadata-only; không mượn ảnh Product khác. |
| HYB-DATA-03 | P0 | Manifest ghi SHA-256 nguồn, mapping, ảnh/derivative, encoder weights, preprocess, code/config, catalog selection và timestamp; rerun cùng input cho cùng thứ tự/rank. |
| HYB-DATA-04 | P0 | Raw CSV/JPEG, customer IDs/hashes và embeddings/derived artifacts ở private ignored storage; không commit/log hay trả trong API. Giữ nhãn synthetic cho VND price/stock. |
| HYB-DATA-05 | P0 | Artifact chỉ chứa context/target Medusa Product IDs đã map; reject stale/orphan/duplicate/self và version khác DB đích trước publish. |

## Thuật toán

| ID | Mức | Điều kiện có thể kiểm thử |
|---|---|---|
| HYB-ALG-01 | P0 | Baseline được khóa trên cùng eligible catalog và context set: exact category, metadata-only hiện tại, popularity prior. Không dùng H&M future transactions để đánh giá purchase prediction. |
| HYB-ALG-02 | P0 | Encoder pretrained được chọn sau khi xác minh license, dependency, weights, dimension, CPU/GPU cost. Preprocess cố định; batch inference và cache theo `(article_id, image_sha, model_sha, preprocess_sha)`. Vector được chuẩn hóa; cosine xử lý zero/NaN. |
| HYB-ALG-03 | P0 | Article-level vector → Product-level vector theo rule ghi trước thí nghiệm: mặc định representative hợp lệ; thử pooling nhiều variant nếu coverage và chi phí cho phép. Chỉ ảnh đúng Product được gộp. |
| HYB-ALG-04 | P0 | Candidate blocking theo taxonomy (`index_group`, category guardrail); không self; tối đa 100/context; sort deterministic `(score DESC, target_product_id ASC)`. Ngưỡng min-score phải tune trên validation, không hạ chỉ để đủ 6. |
| HYB-ALG-05 | P0 | So hai cách: weighted score `w_m*S_m + w_i*S_i + w_p*P_norm` và Reciprocal Rank Fusion. Trọng số 0.40/0.45/0.15 chỉ là cấu hình thử; chuẩn hóa trong cùng eligible candidate universe; cap popularity để không lấn át similarity. |
| HYB-ALG-06 | P0 | Không ảnh/embedding hợp lệ → metadata-only; không metadata đủ → existing deterministic catalog fallback; mọi nhánh ghi `strategy` và `fallback_reason` đúng. |
| HYB-ALG-07 | P1 | Diversity rerank có giới hạn rõ (ví dụ không quá 2 cùng product_type trong top 6 nếu có đủ lựa chọn hợp lệ), không thay saleability hoặc tạo duplicate; đánh giá trước khi bật. |

## Store API và publication

Contract hiện tại là `GET /store/recommendations?placement=product_detail&product_id=prod_...&region_id=reg_...&limit=6` với `x-publishable-api-key` qua Medusa SDK. Route hiện tại cũng hỗ trợ `home`; không xóa. Query cho phép `placement`, `product_id`, `region_id`, `limit`; giá trị khác hoặc `customer_id` → 400. `limit` 1–24 ở input hiện tại nhưng PDP output hard cap 6. Invalid region → 400; target unavailable → 404; flag OFF → 404; dependency/overload/timeout → 503; không có ứng viên hợp lệ → 200 `products: []` hoặc fallback có nhãn đúng. Response hiện tại: `{placement,strategy,version,fallback_reason,products}`; Product projection gồm id/title/handle/thumbnail/images và variants saleable với calculated_price. V2 phải giữ response tương thích; không gửi raw score/article IDs/metadata.

| ID | Mức | Điều kiện có thể kiểm thử |
|---|---|---|
| HYB-API-01 | P0 | Giữ HTTP/status/input/output contract trên; test cả invalid/unknown params và publishable key/channel context. |
| HYB-API-02 | P0 | Chỉ trả published, in-channel, region-priced, inventory/backorder-valid Store Products; dùng batch native Medusa read, không N+1; giá/stock xét tại request time. |
| HYB-API-03 | P0 | Publisher staging → ready → active, idempotent, rollback active pointer về ready run cũ; failed batch không chuyển pointer và không sửa Product/Order. |
| HYB-API-04 | P0 | Publisher hiện chỉ chấp nhận `hm_metadata_similarity` và yêu cầu cả Home/PDP. Đổi sang strategy hybrid phải có ADR + migration/backward compatibility tests; giữ Home rows trong mỗi run. |
| HYB-API-05 | P1 | Cache ứng viên chỉ thêm nếu đo thấy cần; key gồm run version, placement/context, region/channel/publishable context; không cache kết quả price/stock quá hạn. Có timeout và giới hạn concurrency. |

## NFR, đánh giá và kiểm thử

**Định nghĩa metric:** coverage-6 = số PDP contexts có ≥6 ứng viên đủ điều kiện / tổng contexts đủ điều kiện; catalog coverage = số Product được gợi ý ít nhất một lần / số Product eligible; diversity = trung bình số nhóm taxonomy khác nhau trong top K (kèm phân phối). Human relevance: 30–50 contexts được chọn trước theo nhóm/coverage, 2 người chấm độc lập, rubric 0–2 cho cùng loại/kiểu, phù hợp thị giác, không lỗi ảnh, so pairwise với metadata baseline; ghi bất đồng, không dùng agent review thay người. Purchase history không có impression/click, nên không tính CTR/conversion. Nếu dùng offline purchase metric, temporal split và universe theo thời điểm; không dùng dữ liệu tương lai để tạo popularity cho evaluation.

| ID | Mức | Điều kiện có thể kiểm thử |
|---|---|---|
| HYB-NFR-01 | P0 | Đo lại baseline PDP trên cùng SHA/catalog/DB/host rồi mới chọn SLO; mục tiêu thử ban đầu p95 successful requests <800ms ở 30 RPS/60s, error <1%, dropped=0, **chưa đạt** theo báo cáo cũ. Không che 503 khỏi error rate. |
| HYB-NFR-02 | P0 | Báo CPU/RAM/VRAM/disk, inference time, Postgres connections/query count, cold/warm, high/low coverage; không vượt quota test host hay làm cạn pool. |
| HYB-NFR-03 | P0 | Publish và feature extraction bounded batch/memory, có resume/checksum, quan sát được; không có training/inference trên request path. |
| HYB-NFR-04 | P0 | Checkout không phụ thuộc Recommendation; lỗi Redis/candidate store chỉ gây fallback hoặc lỗi rail, không sửa commerce state. |
| HYB-NFR-05 | P0 | Cost estimate phải từ số lượng ảnh thực, byte/ảnh, runtime đo và giá hạ tầng được ghi ngày/nguồn; không khẳng định cost khi chưa đo. |
| HYB-TEST-01 | P0 | Python fixtures: ID/mapping, ảnh thiếu/hỏng, aggregation, normalization, weighted/RRF, tie, cap, no-self, reproducible hashes. |
| HYB-TEST-02 | P0 | Backend unit/HTTP: old+new strategy, Home preservation, publish rollback/failure, negative query, native saleability/channel/price/stock. |
| HYB-TEST-03 | P0 | Playwright PDP 0–6/missing image/price/mobile/keyboard/flag/error; commerce regression Catalog/Cart/Checkout/Payment/Order trên isolated test stack. |
| HYB-TEST-04 | P0 | k6 PDP mixed IDs và cold/warm, 1 vs multiple replicas nếu có điều kiện; lưu raw summary + resource evidence, phân biệt target và actual. |
| HYB-TEST-05 | P0 | Data rights review trước public release; human review trước claim cải thiện relevance; audit Git không chứa raw/private artifacts. |

## Artifact ví dụ (schema đề xuất, không phải dữ liệu thật)

```json
{"article_id":"0000000000","product_id":"prod_EXAMPLE","variant_id":"variant_EXAMPLE","image_sha256":"<sha256>","encoder":"<model-and-license-reviewed>","embedding_dim":"<measured>","status":"valid_or_missing"}
```

```json
{"version":"hyb-private-v2-example","placement":"product_detail","context_key":"product:prod_EXAMPLE","target_product_id":"prod_OTHER","score":0.82,"rank":1,"strategy":"hm_hybrid_similarity"}
```

Không dùng các ID/score minh họa này làm evidence. Candidate JSONL giữ hình dạng publisher hiện tại; `strategy` mới chỉ được phép sau khi HYB-API-04 hoàn thành.

## Traceability

| Requirements | Phase | Code target dự kiến | Test/evidence target |
|---|---|---|---|
| HYB-FR-01/02/03/05 | 06 | `apps/storefront/src/modules/products/components/related-products/index.tsx`, `product-preview/`, `image-gallery/` | `apps/storefront/e2e/pdp-similar-products.spec.ts`, `hm-image-serving.spec.ts`, phase_06_report |
| HYB-FR-04 | 05–07 | `apps/backend/src/api/store/recommendations/route.ts`, Home component | HTTP + Home E2E, phase_07_report |
| HYB-FR-06 | 08 OPTIONAL | proposed session event schema/API | phase_08_report only if approved |
| HYB-DATA-01..05 | 02–03 | `scripts/hm/prepare.py`, `build-image-manifest.py`, proposed `build-visual-embeddings.py` | mapping/checksum fixtures + readback, phase_02/03 reports |
| HYB-ALG-01 | 01 | existing candidate builder + proposed evaluator | baseline metrics/protocol, phase_01_report |
| HYB-ALG-02..07 | 03–04 | proposed `scripts/hm/build-visual-embeddings.py`, `build-hybrid-candidates.py` | golden tests/human rubric, phase_03/04 reports |
| HYB-API-01..05 | 05 | `apps/backend/src/workflows/recommendation/publish.ts`, `modules/recommendation/`, `api/store/recommendations/route.ts` | unit/HTTP/rollback, phase_05_report |
| HYB-NFR-01..05, HYB-TEST-01..05 | 01–07 | `load/recommendations.js`, CI/tests and private artifacts | system matrix + phase_07_report |

## Public release policy

Private technical work may continue with existing local rights decision. Kaggle access and local image readback are **not** permission to redistribute/public-host images, metadata or derived embeddings. Public release stays **NO-GO** until a named owner records applicable Kaggle competition rules, image/derived-artifact rights, model license and distribution decision. Production feature flag stays OFF pending quality, security and performance gates. Related source: [rights decision](../dataset-rights-decision.md), [PDP spec](../pdp/spec.md), [image spec](../images/spec.md).
