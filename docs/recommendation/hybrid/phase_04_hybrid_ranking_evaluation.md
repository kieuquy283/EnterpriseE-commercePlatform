# Phase 04 — Hybrid ranking & evaluation

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 01 và 03 · **Owner:** ML Engineer + QA/Product reviewer · **Estimate:** 3–5 person-days (giả định). Ghép mức giống về thuộc tính, hình ảnh và độ phổ biến rồi so với gợi ý hiện tại. Chỉ chọn cách tốt hơn khi phép đo công bằng và có người đánh giá thật.

**Already exists:** metadata score/blocking tại `scripts/hm/build-mvp-candidates.py`, popularity Home candidates, exact-category review sample. **Missing:** weighted/RRF, calibration, human labels. **Unverified:** v2 cải thiện relevance hay coverage.

**Inputs:** baseline report Phase 01, Product vectors Phase 03, cùng Product/context universe. **Outputs:** ablation table, weighted/RRF configs, 0–100 candidates/context, quality/coverage report, private manifest. **Files proposed:** `scripts/hm/build-hybrid-candidates.py`, `scripts/hm/evaluate-hybrid.py`, `scripts/hm/tests/test_hybrid_candidates.py`, ignored `data/hm/processed/hybrid/`; `reports/phase_04_report.md`.

1. **P0** Cùng `index_group`/taxonomy guardrail và cùng eligible universe; tính metadata score hiện có, image cosine và popularity prior chuẩn hóa theo candidate universe.
2. **P0** So weighted fusion (0.40/0.45/0.15 chỉ là một config sweep) với Reciprocal Rank Fusion; giữ popularity cap, missing image → metadata renormalization, không xem thiếu image là similarity=0 nếu điều đó phạt sai Product.
3. **P0** Khóa validation context trước tuning; test threshold, no-self/duplicate, top100, tie Product ID, min score, negative/NaN, score scale và reproducibility. Diversity rerank có bounded rule, bật chỉ khi không làm giảm relevance.
4. **P0** Hai reviewer thật chấm blind 30–50 PDP contexts theo rubric Phase 01; báo disagreement và phân phối theo nhóm/low coverage. Agent review chỉ diagnostic. Không gọi purchase-only offline metric là CTR.
5. **P1** Chọn model/weights theo rule đã khai trước: không suy tốt hơn từ coverage đơn lẻ; ghi cả contexts bị kém và contexts thiếu ảnh. Nếu không thắng baseline có ý nghĩa thực tế, không publish Hybrid.

**Acceptance:** Given cùng input và config, when rerun, then artifact/rank deterministic. Given Product không ảnh, then metadata-only rank vẫn hợp lệ. Given human labels chưa có, then quality gate = BLOCKED và không claim Hybrid tốt hơn. **Test:** proposed Python unit/evaluator command (sẽ chốt sau khi tạo CLI), existing `python -m unittest discover -s scripts/hm/tests -v`. **Gate:** PASS kỹ thuật với candidate invariants và reproducibility; quyết định publish Hybrid cần human evidence/decision. **Risk/fallback:** popularity bias hoặc 500 pilot thiếu neighbors → giữ active metadata run, chấp nhận <6. **Rollback:** không publish cho đến Phase 05, lưu version cũ. **Core commerce:** offline only. **Next:** 05 nếu gate đạt. Báo cáo: `reports/phase_04_report.md` (proposed).
