# Phase 01 — Data Profiling, Catalog Selection & Medusa Mapping Verification

> **Status:** PASS trên local dev DB và CSV ngày 2026-11-04. [Report](reports/phase_01_report.md). **Priority:** P0.
> **Depends on:** [Phase 00](phase_00_baseline_rights.md). **Unlocks:** [Phase 02](phase_02_popularity_offline.md), [Phase 03](phase_03_similarity_offline.md).
> **Reference:** [Spec](spec.md) (`REC-DATA-01..04`).

## 1. Mô tả đơn giản

Kiểm tra xem **500 Medusa Products/1.874 Variants** đã được báo cáo có thực sự tồn tại trong database đang dùng không, và các sản phẩm này có đủ lịch sử mua/thuộc tính để gợi ý. Chỉ mở rộng lên 1.000/5.000/10.000 Products nếu thống kê chứng minh cần thiết; **không nhập hàng nghìn sản phẩm ngay**.

## 2. Inputs

- Local `data/hm/articles.csv`, `data/hm/transactions_train.csv` và `data/hm/processed/catalog.jsonl`, `manifest.json`, `medusa-mapping.jsonl` nếu đã sinh.
- Medusa target environment và database được chọn rõ (development/test; không lấy nhầm production).
- `scripts/hm/prepare.py`, `apps/backend/src/scripts/import-hm-catalog.ts`, `scripts/hm/README.md`.
- Phase 00 source SHA & rights record.

## 3. Công việc

- [ ] **01.1 Raw profile:** row counts, distinct `article_id` (string 10 chữ số, đã kiểm tra CSV local), null/duplicate, date range, orphan transactions, category/section/type distribution; checksum nguồn. Stream CSV, không nạp toàn bộ transactions vào RAM.
- [ ] **01.2 Catalog profile:** số nhóm, số variants, SKU/handle uniqueness, `source_hash` và price/inventory provenance; phân biệt **Medusa Product count** với **H&M article/Variant count**.
- [ ] **01.3 Interaction coverage:** đối chiếu mọi `article_id` thuộc selected catalog với transactions; số interactions được giữ, product có/không giao dịch, tỷ lệ catalog có history, phân bố popularity/category, số sản phẩm đủ neighbor.
- [ ] **01.4 Mapping DB reconciliation:** từ Store/Product service hoặc Medusa query graph xác nhận Product ID, Variant ID, SKU, handle, published/sales channel, VND price và inventory. Nếu file local chứa ID không còn trong target DB: dừng publishing và sửa mapping bằng readback, không tự giả IDs.
- [ ] **01.5 Selection decision:** giữ 500 nếu đủ đa dạng/coverage cho demo; nếu thiếu, thiết kế stratified selection theo **train-window counts + category diversity**. Không dùng validation/test tương lai để lựa chọn các sản phẩm 'popular'.
- [ ] **01.6 Import safety nếu mở rộng:** backup dev DB; thử `dry-run`, checksum/ID preservation, batch thấp, resume, không tạo duplicate, theo dõi `pg_stat_activity` và `SQLSTATE 53300`.
- [ ] **01.7 Stable outputs:** catalog selection version + mapping checksum; khóa tập product universe cho Phase 02/03, trừ khi làm version mới.

## 4. Code files planned

- **New:** `scripts/hm/profile-interactions.py`, `scripts/hm/tests/test_profile_interactions.py` (tên dự kiến).
- **Modify only if justified:** `scripts/hm/prepare.py` để chọn theo category/history; `apps/backend/src/scripts/import-hm-catalog.ts` để hỗ trợ `dry-run`/resume/atomic mapping.
- **Artifacts local (Git ignored):** `data/hm/processed/catalog-selection.json`, `mapping-verified.jsonl`, `data-quality.json`, `interaction-coverage.json`.
- **Document/evidence (new files only inside docs/recommendation):** `docs/recommendation/evidence/phase_01_data_quality_summary.md`; không sao chép raw CSV/customer hash vào đó.

## 5. Acceptance / stop criteria

- [ ] Mọi `article_id` được chọn ánh xạ tới đúng một SKU/Variant và đúng một Product trong **target DB**; không có collision hoặc orphan mappings trong tập phục vụ.
- [ ] Báo cáo có checksum, train cutoff dự kiến, số products/variants/interactions, missing/zero-history/category coverage.
- [ ] Có quyết định bằng evidence: **500 đủ** hoặc **mở rộng N sản phẩm với lý do**; không tự đặt threshold coverage là đã đạt.
- [ ] Nếu import thêm, chạy lại không nhân đôi; biến thể/price/inventory được kiểm tra; không gây lỗi DB connections trên workload thử.
- [ ] Không lưu/raw customer identifiers hoặc HMAC key trong tài liệu public.

**GO:** mapping chính xác và biết độ phủ; train/validation split protocol được chốt. **NO-GO:** file mapping không khớp DB, thiếu metadata nghiêm trọng hoặc không rõ quyền sử dụng.

## 6. Risks / fallback / handoff

- **Low coverage:** dùng deterministic catalog fallback; không tuyên bố Popularity có chất lượng tốt. Mở rộng 1k/5k như một change request, không phá 500 sản phẩm đã import.
- **Wrong IDs/DB:** không publish candidates; re-read through Medusa workflows; không xóa volume.
- **No images:** không dựa trên ảnh, dùng metadata và placeholder hợp pháp.
- **Handoff:** `selected_product_ids`, mapping, catalog features, cutoff, coverage report và version cho Phase 02/03.
