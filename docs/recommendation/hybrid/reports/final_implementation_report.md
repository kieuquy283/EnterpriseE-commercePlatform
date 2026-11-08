# Hybrid Recommendation v2 — implementation status

**07/11/2026 Asia/Saigon · branch `recommendation-pdp` · baseline SHA `cf16e0ba2e2af3519f79f5d1b516708d64a28605` + uncommitted work.** Không commit/push/merge, không migrate/import/publish. **Verdict:** code nền Hybrid đã có; **chưa hoàn thành Hybrid thật**, PRIVATE GO = NO, PUBLIC GO = NO.

| Phase | Status | Evidence |
|---|---|---|
| 00 Git/safety | PASS isolated test DB; public/model rights pending | [00](phase_00_report.md) |
| 01 Simple baseline | PARTIAL; structural metrics PASS, human/load fresh NOT_RUN | [01](phase_01_report.md) |
| 02 Image readiness | PARTIAL; test DB mapping PASS, visual review pending | [02](phase_02_report.md) |
| 03 Visual embedding | BLOCKED real; fixture math PASS | [03](phase_03_report.md) |
| 04 Hybrid rank | PARTIAL technical; quality/human gate BLOCKED | [04](phase_04_report.md) |
| 05 Medusa publish/API | PARTIAL; HTTP fixture 4/4 PASS, real publish pending | [05](phase_05_report.md) |
| 06 PDP UI | PARTIAL; E2E 20 PASS/6 skipped, real Hybrid pending | [06](phase_06_report.md) |
| 07 System/release | PARTIAL; private/public Hybrid NO-GO | [07](phase_07_report.md) |
| 08 Session tracking | OPTIONAL / AFTER V2, not started | [phase](../phase_08_session_tracking_optional.md) |

**Code:** `scripts/hm/{hybrid_core.py,build-visual-embeddings.py,build-hybrid-candidates.py,evaluate-hybrid.py}`, Python fixture tests; Medusa `src/workflows/recommendation/publish.ts`, `src/api/store/recommendations/route.ts`, `src/scripts/publish-hm-recommendations.ts`, backend unit/HTTP tests; Next `src/modules/products/components/related-products/index.tsx`. No custom schema/migration or dependency installed. Existing Home Popularity candidate rows are copied into v2 artifact and API route still supports Home. Product purchasability remains native Medusa runtime filtering; offline vector computation cannot change price/stock. Hybrid strategy is exposed only once a ready run exists; none exists from this work.

**Actual verification:** [system matrix](system_test_report.md): Python 26/26, backend unit 38/38, HTTP integration 4/4 (3 suites), Playwright 20 PASS/6 skipped, backend/storefront lint/typecheck/build PASS. Browser Hybrid case used a local proxy fixture; it does not prove actual Hybrid ranking. Test DB readback: 1.874 Variant/SKU mappings over 500 Products. No real Hybrid embedding/candidate count/quality, real Hybrid publish/readback or measured v2 latency. Structural baseline artifact: 500 Products, 167 contexts ≥6, 77 zero, top6 catalog coverage 0.836. H&M image aggregate: 496 valid article images and 496/500 Products with any valid image; main `commerce` media state unknown. These counts do not show Hybrid improvement.

**Later real-data update:** [real v2 evaluation](real_v2_implementation_report.md) records 496 actual OpenCLIP image embeddings, weighted/RRF candidate artifacts and a shared-pool Astra proxy comparison of weighted v2 against v1. Across 29 judgeable frozen contexts, v1 nDCG@6 = 0.9152 and weighted v2 = 0.8974; delta −0.0178 with 95% bootstrap interval spanning zero. No Hybrid run was published, and human/public gates remain closed. The Python suite passed 32/32 before the final scoring script was added; real-artifact scoring exited 0.

**Security/rights:** raw CSV/JPEG, customer IDs, vectors, license records and candidates remain in ignored `data/hm/`; no model/asset downloaded this turn. Model checkpoint and review evidence required for publish. `HM_HYBRID_ARTIFACT_DIR` path is guarded by test DB name, `NODE_ENV=test`, explicit flag, human/private-rights manifest status and file checksums. Public permission for H&M/derived data and any chosen model remains unresolved; [dataset-rights decision](../../dataset-rights-decision.md) applies. A model card may have MIT metadata but still warn against untested deployment; review exact checkpoint before use.

**Rerun/rollback:** follow [private runbook](../runbook.md). Isolated Docker and mapping checks now pass. Approve model/checkpoint rights, generate real embeddings/candidates, run independent human pairwise review, then test real publish/readback/rollback/API/E2E/k6 on the same SHA. Do not edit manifests to simulate review or publish on `commerce`. Until then metadata run stays active; backend/frontend flags preserve PDP/Cart/Checkout. No Hybrid DB rollback needed. Untracked `docs/HM_Similar_Products_PDP_Plan_Docs.zip` was preserved.
