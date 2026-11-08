# Planning audit — Hybrid Recommendation v2

**Ngày:** 07/11/2026, Asia/Saigon. **Verdict:** `READY_PRIVATE_ONLY` cho **bước triển khai Phase 00/01/02**, không phải Hybrid đã implement hay đủ điều kiện public. Phải chặn publish Hybrid cho đến khi có human relevance và NFR evidence. Không chạy DB migration/import/training trong lượt planning.

## Baseline và môi trường

| Item | Quan sát trong lượt audit |
|---|---|
| Branch/HEAD | `recommendation-pdp` / `cf16e0ba2e2af3519f79f5d1b516708d64a28605` |
| Remote heads (`git ls-remote`) | `main` `034ced782078c05da6d86e99ecf03a9523121a20`; `recommendation` `6f3c8d99cac44d94f296dbe912ed82d820ac6584`; `recommendation-pdp` cùng HEAD |
| Working tree trước khi tạo docs | chỉ có untracked `docs/HM_Similar_Products_PDP_Plan_Docs.zip`; giữ nguyên |
| Local main | `f4845ba`, behind remote 3 theo `git branch -vv`; không coi là latest main |
| OS / tools | Windows PowerShell; Python 3.10.11; Node v24.15.0; npm 11.12.1, root `packageManager=npm@11.12.1` |
| Medusa / Next | `@medusajs/medusa` 2.21.2 từ `apps/backend/package.json`; Next 15.5.24 từ storefront package |
| DB hiện hành | **UNKNOWN**: không kết nối DB/đọc credential trong lượt planning. Historical image report nêu `recommendation_test` và `commerce`, không suy trạng thái hiện tại. |
| Private artifacts | Local aggregate JSON tại ignored `data/hm/processed/`; không đưa raw/customer records vào docs. |

**Giới hạn lệnh:** Lần gọi `exec_command` đầu với `workdir` trên Windows rơi về `C:\`, trả `not a git repository`; không dùng kết quả đó. Các lệnh sau đặt `Set-Location -LiteralPath 'D:\KieuQuy\Documents\E-commerce'` và trả baseline hợp lệ. Lượt này không chạy Python/Node tests, Playwright, k6, Medusa API hay DB query; mọi PASS từ reports cũ chỉ là **historical evidence**.

## File/source đã đọc hoặc đối chiếu

- Quy mô/scope: `docs/01_Project_Definition.md`, `02_Project_Scope_and_Assumptions.md`, `03_Software_Requirements_Specification.md`; chúng chứa SHA/branch cũ, nên source HEAD được ưu tiên.
- Recommendation nền: `docs/recommendation/spec.md`, `runbook.md`, `dataset-rights-decision.md`, `similarity-review-protocol.md`, `reports/final_implementation_report.md` và các `reports/phase_XX_report.md`. `plan.md` và `phase_*.md` nền **không tồn tại tại HEAD** sau commit `62beb45`; không khôi phục.
- PDP: `docs/recommendation/pdp/spec.md`, `runbook.md`, `reports/final_implementation_report.md`, `reports/system_test_report.md` và phase reports/evidence inventory. Image: `docs/recommendation/images/spec.md`, `runbook.md`, `reports/final_implementation_report.md`, `reports/real_hm_images_2026-11-06.md`, phase report headings. Historical checkpoint trong image final report có BLOCKED, phần update 06/11 và real-image report ghi pilot sau khi Kaggle access được sửa; dùng mốc mới hơn nhưng vẫn chỉ là historical.
- ETL/ML source: `scripts/hm/prepare.py`, `build-mvp-candidates.py`, `profile-interactions.py`, `remap-candidates.py`, `image_pipeline.py`, `build-image-manifest.py`, `download-images.py`, `validate-images.py`, `optimize-images.py`, `scripts/hm/tests/` (inventory và key function/contract). H&M CSV **không đọc nội dung** trong lượt này.
- Backend: `apps/backend/medusa-config.ts`, `src/modules/recommendation/{models,service.ts,store-products.ts,coalesce.ts}`, `src/workflows/recommendation/publish.ts`, `src/api/store/recommendations/route.ts`, `src/scripts/import-hm-images.ts`, `src/scripts/publish-hm-recommendations.ts` inventory, `integration-tests/http/recommendations.spec.ts` inventory.
- Frontend: `apps/storefront/src/lib/data/recommendations.ts`, `src/modules/products/components/{related-products,product-preview,image-gallery,product-image,thumbnail}/`, `next.config.js`, `e2e/` inventory; `.github/workflows/{ci,api-tests}.yml`, `load/recommendations.js`, package manifests.

**Lệnh audit thực chạy:** `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git branch -vv`, `git log -5 --oneline`, `git rev-parse origin/main origin/recommendation origin/recommendation-pdp`, `git ls-remote origin refs/heads/main refs/heads/recommendation refs/heads/recommendation-pdp`, `git diff --name-only origin/main...HEAD`, `git diff --name-only origin/recommendation...HEAD`, `rg --files`/`rg -n` trên các thư mục nêu trên, `Get-Content` với file code/spec, `python --version`, `node --version`, `npm --version`, và Python `json.loads` chỉ in aggregate/local manifest fields. Một `rg` với wildcard Windows không hợp lệ và một tìm kiếm đường dẫn `apps/storefront/tests` không tồn tại; đã thay bằng `rg --files` và thấy tests thực nằm tại `apps/storefront/e2e/`.

## Implemented, unverified, missing

**Implemented tại source HEAD:** Python popularity/metadata candidate builder; Recommendation module models + active run; publisher; Store API giới hạn 6 PDP/12 Home; native Store Product batch resolver, region/price/stock filtering; Next server fetch + PDP fallback; image manifest/download/validate/optimize scripts; guarded test DB media importer; unit/HTTP/Playwright/k6 files. Publisher hiện reject strategy khác `hm_metadata_similarity`, do đó v2 cần thay contract có test. `apps/backend/medusa-config.ts` config Medusa 2.21.2, Redis optional, S3 khi env đủ, local File provider chỉ trong test.

**Historical/local evidence, chưa re-run:** local `manifest.json` ghi 500 Product groups/1.874 articles từ 105.542 rows; image summary 496 valid/1.874 mapped articles và 496/500 Products có ít nhất một ảnh, 4 Products thiếu; candidate manifest ghi `min_score=0.7`, human `NOT_REVIEWED`; PDP report ghi 3.198 Similar rows, 167/500 contexts đủ 6, 77 zero và 30RPS final HTTP error 48.83% trên 1 replica. Real-image report 06/11 ghi test DB import và browser readback, còn main `commerce` 0/500 thumbnails tại thời điểm đó. **Không suy đây là trạng thái DB hiện giờ.** CI `cf16e0b` xanh theo lượt kiểm tra ngay trước audit, không phải v2 CI.

**Missing/UNKNOWN:** Hybrid/image encoder, vector version/store, weighted/RRF evaluator, human labels, hiện trạng DB đích, public Kaggle/image/embedding rights, model license, v2 cost, v2 load profile. Không có proof CTR/conversion. Phiên này không đọc secret hoặc khách H&M.

## Quyết định và pending

**Chốt cho kế hoạch:** offline batch embedding/candidate, reuse Medusa module/API/Next, representative first và pooling experiment, metadata fallback, Home preserved, private-only, production flag OFF; CF/session tracking là optional sau v2. **Pending:** model/license/dimension/resource, weighted vs RRF winner, human relevance, target NFR sau baseline, exact DB write target, public data/image/derived rights. Mọi quyết định pending có safe default ở [plan](../plan.md) và [spec](../spec.md).

## Tài liệu được tạo và self-review

[README](../README.md) · [plan](../plan.md) · [spec](../spec.md) · [00](../phase_00_repository_baseline.md) · [01](../phase_01_simple_baseline_evaluation.md) · [02](../phase_02_image_data_readiness.md) · [03](../phase_03_visual_embeddings.md) · [04](../phase_04_hybrid_ranking_evaluation.md) · [05](../phase_05_medusa_publishing_api.md) · [06](../phase_06_pdp_integration.md) · [07](../phase_07_system_testing_release.md) · [08 optional](../phase_08_session_tracking_optional.md) · báo cáo này: **13 Markdown files**.

Self-review checklist: mỗi phase có dependency, P0/P1/P2 tasks, inputs/outputs, files, Given/When/Then, PASS/BLOCKED, rollback, owner/estimate và report **proposed**; spec có stable IDs + traceability; plan tách online/offline, source vs proposal, risks, rights, critical path. Links được kiểm ở bước cuối của lượt audit; nếu tool báo link lỗi sẽ sửa trước khi kết thúc. Không có implementation report/test PASS mới. **Recommended first implementation task:** Phase 00, sau đó 01 và 02 có thể chạy song song; chặn Phase 04 publish nếu thiếu human/quality gate.
