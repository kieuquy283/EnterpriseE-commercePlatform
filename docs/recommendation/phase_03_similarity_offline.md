# Phase 03 — Metadata-Based Similar Products Offline Pipeline

> **Status:** PASS private technical gate theo [ADR](adr-private-validation.md); human relevance review NOT_RUN/public NO-GO. [Report](reports/phase_03_report.md).
> **Depends on:** [Phase 01](phase_01_data_readiness.md). **Parallel with:** [Phase 02](phase_02_popularity_offline.md).
> **Reference:** [Spec](spec.md) (`REC-ALG-02`, `REC-DATA-01`).

## 1. Mô tả đơn giản

Từ thông tin loại hàng, nhóm hàng, bộ phận, màu và mô tả của H&M, tính trước **100 sản phẩm có metadata giống mỗi sản phẩm**. Trên PDP chỉ hiển thị tối đa 6, không gồm chính món đang xem. Đây là similarity theo thuộc tính, **không khẳng định hai món từng được mua chung trong một đơn**.

## 2. Inputs

- `catalog.jsonl` và Product/Variant IDs đã được verify tại Phase 01.
- Thuộc tính `product_type`, `product_group`, `section`, `department`, `garment_group`, `index_group`, `description`, tập màu của variants.
- Quy tắc grouping hiện tại giữ product_code + type/group/department/section; không đổi product identity tùy tiện.

## 3. Tasks

- [ ] **03.1 Feature extraction:** normalize metadata, strip/casefold, tokenization đơn giản cho tiếng Anh, create color set; không dùng ảnh H&M nếu chưa có quyền.
- [ ] **03.2 Candidate blocking:** ưu tiên cùng `index_group` và taxonomy liên quan; khi mở rộng lên 5k/10k không tính all-pairs N² toàn catalog.
- [ ] **03.3 Baseline:** Exact Category Match (product_type/group), deterministic ordering.
- [ ] **03.4 Weighted score:** product_type .30, product_group .20, section .15, department .10, garment_group .10, color set .05, description overlap .10. `index_group` là guardrail, không cộng double-count.
- [ ] **03.5 Missing rule:** chuẩn hóa trên tổng trọng số features có dữ liệu **ở cả hai Product**, nhưng bắt buộc có taxonomy match để tránh score=1 từ một feature yếu; log eligible_weight.
- [ ] **03.6 Threshold:** chọn min_score bằng validation/spot-check, không tuyên bố default đã tối ưu; không đủ candidates thì Phase 05 dùng fallback popularity.
- [ ] **03.7 Candidate generation:** exclude self; unique target ID; Top 100/context, score desc và ID tie-break; active product identity là **Medusa Product**, không phải article.
- [ ] **03.8 Tests/evaluation:** missing metadata, duplicate, color union, taxonomy conflict, empty neighbors; chọn tối thiểu 20 contexts từ nhiều categories để reviewer xem Top 6 và ghi relevance.

## 4. Planned files / artifacts

- **New code:** `scripts/hm/build-similar-candidates.py`, `scripts/hm/tests/test_similar_candidates.py`.
- **Artifacts (Git ignored):** `data/hm/processed/candidates-product-detail.jsonl`, `similarity-evaluation.json`, `feature-profile.json`.
- **Docs:** `docs/recommendation/evidence/phase_03_similarity_report.md` sau khi chạy/đánh giá thực.

## 5. Acceptance criteria

- [ ] Mỗi context `product:<product_id>` có 0..100 candidates, target không bằng context, không có duplicate, rank liên tục.
- [ ] Candidates có product IDs thuộc selected catalog đã verify; score trong [0,1] nếu dùng normalization nêu trên.
- [ ] Missing values không tạo match sai; taxonomy guardrail thực thi; same inputs → same top order.
- [ ] Chạy unit tests và báo cáo so sánh với Category Match baseline, kèm tỷ lệ contexts có tối thiểu 6 neighbors đủ ngưỡng.
- [ ] Khi chưa có ảnh, kết quả được mô tả là *metadata similarity*; human review chỉ là proxy, không phải ground-truth thị giác.

## 6. Stop/Go / rollback

**STOP:** metadata không đủ hoặc score chủ yếu do trùng taxonomy/thiếu features; điều chỉnh weights/selection rồi rerun evaluation. **GO:** candidate artifacts, tests, report và source hashes đủ để sang Phase 04. **Rollback:** thay version artifact, không sửa Medusa catalog. **Handoff:** similarity scoring config, threshold, candidate JSONL và review notes.
