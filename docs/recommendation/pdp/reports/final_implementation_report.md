# H&M Similar Products PDP — Final Implementation Report

Chốt ngày04/11/2026 13:27 Asia/Saigon. Branch review `recommendation-pdp`, baseline `6f3c8d99cac44d94f296dbe912ed82d820ac6584`. Verification chạy trên baseline+working changes; [source hashes](../evidence/source-verification.json) xác định nội dung code. Không suy results từ báo cáo MVP cũ.

**Đã hoàn thiện hardening và kiểm thử PDP; chưa đạt mục tiêu tải30RPS.** Có thể demo thủ công trong môi trường private. Không public release, không claim production readiness hoặc toàn bộ system PASS.

## Trạng thái7 phase

| Phase | Outcome | Evidence |
| --- | --- | --- |
|00 Audit & Safety |PASS PRIVATE; public rights unresolved |[Report](phase_00_report.md) |
|01 Data & Mapping |PASS;1874 mappings/500 Products/raw articles readback |[Report](phase_01_report.md) |
|02 Offline similarity |Technical PASS;human relevance NOT_RUN |[Report](phase_02_report.md) |
|03 Publishing & API |Correctness PASS;32 unit/4 HTTP tests |[Report](phase_03_report.md) |
|04 PDP production UI |PASS;18 full browser tests+1 OFF |[Report](phase_04_report.md) |
|05 System/performance |PARTIAL;30RPS target NOT MET |[Report](phase_05_report.md) |
|06 Review/reporting |PASS reporting;restricted private GO/public NO-GO |[Report](phase_06_report.md) |

## Changes thực tế

- Scorer xử lý `Unknown`/normalization đúng; giữ weights/threshold0.70. Validator PDP mới kiểm raw articles/group mapping/stale candidates/schema và repeat hashes, không đọc customers/transactions.
- API reuse Recommendation module/publisher; gộp target+primary native batch, fallback metadata ordering rồi native price/stock validation theo batches; không snapshot stale commerce data. No new module/migration/core SQL writes.
- RelatedProducts dedupe/no self/cap6 cả API và legacy; semantic heading/section; failure fallback/hide không chặn PDP. Dùng ProductPreview và giá Medusa.
- Production ON/OFF build isolation, local-only fault proxy, PDP E2E/mobile/keyboard/VND/missing-image tests. Test helper đợi cart state thay vì chờ optional response stream hết; không đổi cart/checkout/payment logic.
- k6 hỗ trợ PDP multiple contexts, correctness threshold/capacity counters; test-only3 replica overlay build cùng source trước chạy.

File list: `scripts/hm/{build-mvp-candidates.py,verify-pdp-candidates.py,pdp-test-proxy.mjs,probe-pdp.mjs,tests/test_mvp_candidates.py,tests/test_pdp_verification.py}`; `apps/backend/src/api/store/recommendations/route.ts`, module unit test và `integration-tests/http/recommendations.spec.ts`; `apps/storefront/src/modules/products/components/related-products/index.tsx`, `next.config.js`, `e2e/{pdp-similar-products.spec.ts,checkout-flow.ts}`; `.gitignore`, `load/recommendations.js`, `deploy/docker-compose.pdp-scale-test.yml`; PDP docs/reports/evidence và link bổ sung trong root Recommendation runbook. Master plan/spec tổng thể không sửa. Dataset zip người dùng không được upload cùng feature.

## API, model và UI

Giữ contract `GET /store/recommendations?placement=product_detail&product_id=…&region_id=…&limit=6`. Native published/channel/region/price/inventory/backorder validation; tối đa6 unique non-self StoreProducts theo rank rồifallback,không raw article IDs/SKU/score/metadata. `hm_metadata_similarity`→Similar products; mixed/catalog→You may also like. Params sai400, unavailable target404, overload/dependency503; proxy có thể504 trước handler khi PG unavailable.

500 Product groups/1874 variants;3198 Similar rows;167 contexts≥6,77 zero;ExactCategory baseline238≥6. Không suy weighted tốt hơn từ coverage hoặc agent spotcheck. Human relevance **NOT_RUN**. Version `pdp-private-v3` publish3298 rows gồm100 Home preserved. Re-publish idempotent; thực tập rollback `rec-private-serving-v2` rồi restorev3,probes200 đúng version. Ready immutable; config/input đổi phải version mới.

## Tests và benchmark actual

Python **9/9**, backend unit **32/32**, full HTTP **4/4 (3 suites)**, production browser **18/18**, production frontend OFF **1/1**. Backend/frontend typecheck/lint/build exit0;18 existing frontend lint warnings. Build test backend không bao gồm Admin bundle. Failures/retests được giữ và giải thích trong [system report](system_test_report.md); không bỏ assertions để báo PASS.

PDP30 contexts,30RPS60s,500-product test catalog,Docker8CPU/7.631GiB:

| Profile | p50/p95/p99 ms | HTTP error | Dropped | Outcome |
| --- | --- | ---: | ---: | --- |
|1 API isolated final |272.24 /732.81 /864.23 |48.83%|0|NOT MET:880 capacity rejections |
|3 API final |785.59 /1494.61 /1879.84 |24.00%|5|NOT MET:431 capacity rejections |

Không dùng Home p95 làm PDP evidence; quick503 làm p95 tổng thấp hơn successful-only profile. Không cam kết30RPS thành công. [Load JSON](../evidence/pdp-load-verification.json) lưu exact metrics,provenance và resource samples. NFR cần tiếp tục profile/giảm chi phí native commerce hydration; scale thêm trên cùngVM không giải quyết đủ vấn đề đã đo.

Redis stop→200/6/105ms;PG stop→Caddy504/5057ms;start lại vàprobe200v3. Không mất dữ liệu hoặc reset commerce. Unit/HTTP candidate-store failure không được gọi là một physical independent DB outage vì candidate/commerce cùng PostgreSQL.

## Gaps và release decision

| Gap | Status | Next owner/action |
| --- | --- | --- |
| PDP30RPS capacity/error/latency |NOT MET |Backend/QA profile CPU/native queries,fix vàrerun cùng workload;không giảmSLO đểpass |
| Human20-context relevance |NOT_RUN |Reviewer người thật chấm weighted vàbaseline,giữ lý do/labels |
| Kaggle/H&M public rights |BLOCKED |Chủ dữ liệu xác minh điều khoảnmetadata/ảnh/derived assets |
| RemoteCI/PR review/main integration |Chưa nghiệm thu |Review branch/PR,đợi actualCI;không auto merge |
| Full WCAG/long endurance/cloudHA |NOT_RUN/out of scope |Không suy từkeyboard360px/60s tests |

**PRIVATE MANUAL DEMO GO;PRIVATE30RPS RELEASE NO-GO;PUBLIC NO-GO.** Bộ report hoàn tất không biến những gaps thành tính năng đã đạt.

## Git và vận hành

Branch `recommendation-pdp` tách từ baseline đã có MVP;giữ input docs/zip của người dùng,không forcepush/reset/main merge. PR review và remoteCI trạng thái sẽ được ghi chỉ khi có URL/run thực tế. RawCSV/privatekeys/customerhash/artifacts/logs không vàoGit.

[PDP runbook](../runbook.md) bổ sung [runbook nền](../../runbook.md):productionON8003/OFF8004,harness9006,Medusa9004;previewdev8001 vẫn là môi trường khác. Tắt frontend flag cần rebuild. Ready-run rollback không cần xóa Product/Orders/DB. API phụ thuộc native exportsMedusa2.21.2;upgrade phải retest. Dedicated Medusa agent skills/MCP không có trong session;kiểm theo installed source vàregression tests,không tự cài thêmtooling.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
