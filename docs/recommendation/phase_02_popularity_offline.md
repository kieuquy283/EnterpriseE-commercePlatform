# Phase 02 — Popularity Offline Pipeline & Train-only Evaluation

> **Status:** PASS offline private pilot; [report](reports/phase_02_report.md). Online serving/fallback đã triển khai ở Phase 05.
> **Depends on:** [Phase 01](phase_01_data_readiness.md). **Can run in parallel:** [Phase 03](phase_03_similarity_offline.md).
> **Reference:** [Spec](spec.md) (`REC-ALG-01`, `REC-DATA-01/03`).

## 1. Mô tả đơn giản

Đếm sản phẩm xuất hiện nhiều trong lịch sử mua H&M, **gộp các variants thành Medusa Product**, sau đó tạo danh sách Popular Top 100 để backend chọn 12 thẻ trên trang chủ. Cần **tách dữ liệu trước/sau thời điểm đánh giá** để không dùng tương lai dự đoán quá khứ.

## 2. Inputs

- Verified `article_id → Medusa Product ID` mapping + selected catalog từ Phase 01.
- `transactions_train.csv`, schema giao dịch H&M, ngày `t_dat`, có thể đọc dạng stream.
- `scripts/hm/prepare.py`, `scripts/hm/build-popularity-candidates.py` hiện có.
- Phase 01 data profile để chọn temporal train/validation/test cutoffs.

## 3. Tasks

- [ ] **02.1 Split:** chọn cutoff theo thời gian, ghi train/validation/test non-overlap, seed và universe; chỉ dùng train để xếp hạng ở report offline. Nếu số interactions của subset không đủ, báo không đủ điều kiện đánh giá user-level.
- [ ] **02.2 Aggregate:** count mỗi article rồi map và cộng theo product; bỏ unknown article với counters; không đếm giá tiền/timestamp thành VND hiện tại.
- [ ] **02.3 Baseline:** so sánh H&M purchase popularity với deterministic catalog order / category popularity nếu có; tie-break theo Medusa Product ID.
- [ ] **02.4 Serving artifact:** sau khi đã đóng evaluation, được phép tạo version cuối từ toàn bộ lịch sử được quyền sử dụng; gắn nhãn `hm_historical`, không tuyên bố current shopper trend.
- [ ] **02.5 Fallback:** nếu Product không có history thì backend dùng valid Medusa catalog; không tự đặt giá/tồn kho.
- [ ] **02.6 Tests:** multi-article→one Product aggregation; missing mapping; tie-break; no future leakage; deterministic file hashing; zero-history.
- [ ] **02.7 Privacy simplification:** aggregate counts không cần customer ID/HMAC; chỉ tạo hashed customer IDs riêng nếu làm metric user-level, giữ secret ngoài Git.

## 4. Planned code & artifacts

- **Modify:** `scripts/hm/build-popularity-candidates.py` (versioned output, train/serving distinction, mapping validation).
- **Potential new:** `scripts/hm/evaluate-popularity.py`, `scripts/hm/tests/test_popularity.py`.
- **Generated Git-ignored:** `data/hm/processed/popularity-train.json`, `popularity-serving.json`, `candidates-home.jsonl`, `popularity-evaluation.json`.
- **Docs:** `docs/recommendation/evidence/phase_02_popularity_report.md` khi có kết quả thật.

## 5. Metrics & acceptance

| Measure | Acceptance contract |
|---|---|
| Mapping | 100% candidates đều có Medusa Product ID có thật trong selected catalog được xác minh |
| Data leakage | Mọi count dùng cho *offline metrics* chỉ đến train cutoff |
| Ranking | Sort score desc + product ID tie-break; không trùng Product ID |
| Candidate pool | Tối đa 100 cho `home`, có thể ít hơn nếu thiếu dữ liệu |
| Offline quality | Report train/validation cutoffs, coverage, Recall@12 và MAP@12 **nếu metric xác định được**, có baseline so sánh |
| Reproducibility | Cùng input/checksums/config → cùng rank/candidates |

**Metric caveat:** MAP@12 của H&M thường tính theo article và customer; khi gộp Medusa Product IDs và dùng global popularity, report phải nói rõ **đơn vị đánh giá đã đổi** và không so trực tiếp với điểm leaderboard.

## 6. Stop/Go, rollback, handoff

- **STOP:** mapping lỗi, split bị leakage hoặc artifact không tái tạo được. Không dùng `popularity.json` toàn bộ lịch sử để báo cáo kết quả trên test cũ.
- **GO Phase 04:** candidate JSONL hợp lệ + offline report/limitations + hash/config đầy đủ.
- **Rollback:** giữ candidate version trước, không đổi Medusa products/transactions.
- **Handoff:** artifact version, train cutoff, scores/ranks và score meaning, evaluation report.
