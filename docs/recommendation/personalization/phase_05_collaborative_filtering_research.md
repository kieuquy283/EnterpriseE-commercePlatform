# Phase 05 — Collaborative Filtering offline research (P1, optional)

**Mô tả đơn giản:** Kiểm tra xem học từ nhóm người từng mua sản phẩm nào có giúp gợi ý tốt hơn không, trước khi thêm ML vào dịch vụ thật.

> **Không block MVP P0.** Không ánh xạ H&M customers sang Medusa Customers. Không triển khai public model khi chưa qua rights/domain-shift gate.

## Dependencies

Phase 00 rights/manifest decisions, `data/hm/transactions_train.csv`, validated product mapping, [evaluation protocol](evaluation_protocol.md).

## Tasks

1. Đọc H&M event history offline streaming, preserve leading zero `article_id`, map Product/Variant correctly, count H&M users/items/events eligible and training coverage. Không commit raw H&M customers hoặc transaction identifiers.
2. Train/validation/test split theo thời gian; freeze catalog & users; evaluate chronological next-purchase ranking for H&M historical user **within H&M only**. No future activity in training/profile, no article/product level metric confusion.
3. Baselines: Popularity, V1 taxonomy/content profile, ItemKNN co-purchase; research models: `implicit` ALS, optional BPR. Model factors/runs are immutable/private. CPU proof first; record cost, RAM, runtime.
4. Compare under same user/product universe: Recall@12, nDCG@12, HitRate@12, user/item coverage, cold-start, sparse-event cohorts, CI; explain skipped users/no-heldout, repeats, catalog sampling bias.
5. Optional *transfer of item-item similarities only* considered with explicit license permission and empirical validation on real consented Medusa events; never transfer H&M user embeddings as identities/profile factors.
6. If not enough real Medusa events, keep CF offline research artifact and use Rule-based MVP. Missing rights/CSV/coverage → mark `BLOCKED` rather than claim model good.

## Exit criteria

- [ ] Reproducible artifact hashes, temporal split, no leakage, complete eligible population report.
- [ ] Paired baseline comparison with uncertainty, not only accuracy on one random split.
- [ ] No H&M IDs or raw customer data in Git/public reports.
- [ ] Written `DEPLOY/EXPERIMENT/REJECT` decision with explicit domain-shift caveat.

**Report:** `reports/phase_05_report.md`. Independent research completion never substitutes privacy/API gates.
