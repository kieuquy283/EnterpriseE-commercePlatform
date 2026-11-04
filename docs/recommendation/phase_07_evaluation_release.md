# Phase 07 — End-to-End Evaluation, Performance, Release & Evidence

> **Status:** PASS private measured pilot; public NO-GO. [Report](reports/phase_07_report.md). **Depends on:** [Phase 06](phase_06_storefront.md) plus approved private offline artifacts from Phases 02/03.
> **Reference:** [Spec](spec.md) (`REC-NFR-01..05`, evaluation/rights); [Plan](plan.md).

## 1. Mô tả đơn giản

Đây là bước **chứng minh tính năng có thật, đủ an toàn và đủ nhanh** trước khi đưa vào bản demo. So sánh chất lượng offline với baseline, chạy API/UI tests, đo tải và thử khi Redis/candidate store lỗi. Nếu kết quả chưa đủ, giữ tính năng ở chế độ OFF.

## 2. Inputs

- Phase 00 rights decision; Phase 01 mapping/coverage; Phase 02/03 candidate quality reports; Phase 04 publish run; Phase 05 API tests; Phase 06 UI E2E.
- Test/dev/staging infrastructure, dedicated data snapshots and versioned release commit.
- Resource profile (VM CPU/RAM, dataset size, PostgreSQL connections), k6 test tool.

## 3. Tasks

- [ ] **07.1 Reproducibility:** snapshot source SHA, data checksum, catalog selection, mappings, score weights, train cutoff, active run ID, artifact versions.
- [ ] **07.2 Offline evaluation:** Popularity compared with deterministic/category baseline (Recall@12/MAP@12 only at declared product/article/customer unit); Similarity compared with Category Match on manually reviewed 20+ sample contexts, report coverage/diversity and missing images limitations.
- [ ] **07.3 API integration:** check `200`/validation errors, published/price/stock/region/channel filtering, no current product, no duplicates, source IDs not leaked; active version/rollback, cache invalidation.
- [ ] **07.4 Fault injection:** Redis down → PostgreSQL candidates; candidates unavailable → safe Medusa catalog fallback; commerce DB down → error/no false success; no impact on checkout/order regression.
- [ ] **07.5 Performance:** create `load/recommendations.js`, test warm/cold at **proposed 30 RPS** profile; record p50/p95/p99, errors, throughput, CPU/RAM, query counts, PostgreSQL connections, Redis hits/misses. Proposed targets p95 warm <250ms, cold <800ms, error <1%; report failures honestly.
- [ ] **07.6 UX/E2E:** homepage 12/PDP 6 under feature flag on/off, mobile, empty/error/loading. Compare core checkout tests before/after.
- [ ] **07.7 Security/rights:** ensure no raw H&M dataset/images/hashes in Git/API/logs. Require explicit legal/terms review for public demonstration; if unclear choose private/demo assets or no release.
- [ ] **07.8 Release review:** GO only if all Must-within-optional feature tests pass and no core regressions; NO-GO to public if data rights unclear. Feature flag defaults OFF until approval.
- [ ] **07.9 Final docs:** update `spec.md` with actual contract/version/status, fill evidence index, open remaining risks, avoid inventing values.

## 4. Planned files and report structure

- **Code/test:** `load/recommendations.js`, integration/E2E suites from Phase 05/06.
- **New docs only within recommendation folder:**

```text
docs/recommendation/evidence/
  phase_07_offline_evaluation.md
  phase_07_k6_performance.md
  phase_07_failure_recovery.md
  phase_07_release_decision.md
```

- Raw k6 measurement files that may be large should go to a controlled artifact store or gitignored local path, with **sanitized summaries/links** in the docs above.

## 5. Final acceptance matrix

| Test gate | PASS when | If not |
|---|---|---|
| Data/rights | Source/mapping verified, public use approved or demo restricted accordingly | NO-GO public |
| Algorithm | Offline metrics/baseline comparison present with no leakage, Similarity manual spot-check | Keep as offline experiment |
| API/data | No invalid Medusa product and no sensitive data leaks | NO-GO feature |
| Publish | Partial publish invisible, rollback works | NO-GO feature |
| UI | Home/PDP correct limits, flag-off/empty/errors safe | NO-GO release |
| Reliability | Redis/candidate failures safe, core checkout unaffected | NO-GO if commerce regresses |
| Performance | Measured p95/error/DB connections with test profile, values compared to targets | Optimize/risk accept with review; no fake `MET` |
| Evidence | SHA/environment/dataset/report/owner/limitations recorded | NOT VERIFIED |

## 6. Stop/Go and rollback

**GO (private/dev):** core functionality + evidence pass, rights scope obeyed. **GO (public):** additionally explicit permission/terms decision. **NO-GO:** mapping, product validity, privacy, checkout regression or incomplete publish/rollback fails. **Fallback:** flag OFF, revert active run; never delete core products/orders/database volumes to remove Recommendations.

## 7. Suggested evidence row template

| Run ID | Date | Commit | Environment | Data/version | Expected | Actual | PASS/FAIL | Limitation | Evidence link |
|---|---|---|---|---|---|---|---|---|---|
| _Fill after execution_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ | _Fill_ |
