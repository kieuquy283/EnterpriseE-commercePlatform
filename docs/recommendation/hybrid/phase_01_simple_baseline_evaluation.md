# Phase 01 — Đo Simple baseline

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 00 · **Owner:** ML Engineer + QA · **Estimate:** 2–3 person-days (giả định). Muốn biết v2 có tốt hơn phải đo cách gợi ý hiện tại trên cùng tập sản phẩm. Báo cáo cũ là mốc tham khảo, không phải kết quả mới.

**Already exists:** `scripts/hm/build-mvp-candidates.py`, `scripts/hm/verify-pdp-candidates.py`, `docs/recommendation/similarity-review-protocol.md`, `load/recommendations.js`; PDP report ghi 167/500 đủ 6 và 77 zero. **Missing:** human labels, shared v2 comparison harness. **Unverified:** eligibility/current active run và performance trên DB hiện tại.

**Inputs:** mapping, current candidate artifact, eligible Medusa products (read-only), 30–50 contexts chọn trước theo type/coverage. **Outputs:** baseline metrics, sample/rubric, measured PDP latency. **Files:** reuse `scripts/hm/build-mvp-candidates.py`, `verify-pdp-candidates.py`; proposed `scripts/hm/evaluate-hybrid.py`, `scripts/hm/tests/test_hybrid_evaluation.py`; private metrics dưới `data/hm/processed/`; report `reports/phase_01_report.md` (proposed).

1. **P0** Khóa eligible universe, context selection, top6/category baseline/metadata baseline cùng SHA/mapping; định nghĩa coverage-6, catalog coverage, taxonomy diversity và self/duplicate.
2. **P0** Chuẩn bị rubric 0–2 và hai reviewer thật, 30–50 contexts cân bằng nhóm và 0/ít/nhiều candidates; ghi blind pairwise, bất đồng, không tự chấm thay người.
3. **P0** Chạy Python fixtures và exact-category/metadata evaluation; không dùng H&M future purchases trong popularity evaluation. Nếu reviewer vắng, human result = NOT_RUN.
4. **P1** Ở isolated stack đo k6 PDP mixed contexts, warm/cold, lỗi/503, p95 success-only, DB connections/CPU/RAM. Chỉ làm khi Phase 00 đã xác nhận test target.

**Acceptance:** Given cùng context/universe, when chạy evaluator hai lần, then metrics/ranks/hash giống nhau. Given 0 neighbors, then coverage vẫn tính denominator và không bịa đủ 6. Given không có người chấm, then không kết luận relevance. **Commands:** `python -m unittest discover -s scripts/hm/tests -v` (đã có); evaluator CLI là proposed/TODO. **Gate:** PASS kỹ thuật khi baseline reproducible và metrics đủ; quality claim BLOCKED nếu thiếu human labels. **Risk/fallback:** pilot 500 thiên lệch → báo stratification. **Rollback:** chỉ private artifacts, không publish. **Core commerce:** read-only. **Next:** Phase 04 cần report này. Báo cáo: `reports/phase_01_report.md` (proposed).
