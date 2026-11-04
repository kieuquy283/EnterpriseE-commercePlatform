# PDP Similar Products — System Test Report

Chốt: 04/11/2026 13:25 Asia/Saigon. Baseline `6f3c8d99cac44d94f296dbe912ed82d820ac6584`; implementation được test dưới working diff từ baseline này. Final branch `recommendation-pdp`; source hashes trong [evidence](../evidence/source-verification.json). Không nói tests đã chạy trên một commit mới khi chưa có commit đó.

Windows PowerShell, Node24.15.0, Python3.10.11, npm11.12.1, Medusa2.21.2, Next15.5.24. PostgreSQL16.15 test DB `recommendation_test`; Medusa HTTP runner tạo DB disposable riêng có guard. Docker Desktop8CPU/7.631GiB. Private artifacts/context/log trong `data/hm/`, không commit.

**Verdict: PARTIAL.** Data/API/UI/commerce regression đạt; target PDP30RPS chưa đạt. Không SYSTEM PASS toàn diện. Public rights và human relevance chưa có bằng chứng.

## Test matrix actual

| ID | Expected | Command / actual | Exit | Status |
| --- | --- | --- | ---: | --- |
| PDP-T01 | Offline block/Unknown/score/tie/top100/repeat | `python -m unittest discover -s scripts/hm/tests -v`;9 tests |0|PASS |
| PDP-T02 | Correct mapping/raw source/stale rejection | `check-hm-mapping.ts` qua Medusa exec:1874/500; `verify-pdp-candidates.py` hai lần, raw105542 rows; same hash |0|PASS |
| PDP-T03 | Immutable/idempotent/staging fault/rollback | HTTP suite + real publisher3298 rows; activev3→v2→v3, probes200 |0|PASS |
| PDP-T04 | Bad product/region/placement/limit/customer query | Full HTTP suite4 tests/3 suites; expanded PDP table400, missing target404 |0|PASS |
| PDP-T05 | Native status/channel/pricing/stock/backorder | HTTP suite: draft/empty channel/USD unpriced/stock0 excluded, PDP stock0 target404 then backorder200 |0|PASS |
| PDP-T06 | Safe fallback/faults | Unit candidate store failure, HTTP invalid pointer; real Redis-down200/6/105ms; PG-down504/5057ms frontdoor |0|PASS within scope |
| PDP-T07 | ≤6/unique/no self/valid links/rank/VND | Unit ordered resolver test + production E2E |0|PASS |
| PDP-T08 | Full/sparse/zero H&M/non-H&M/no image | Three real H&M contexts + base commerce PDP; placeholder SVG asserted |0|PASS |
| PDP-T09 | Build flags/503/404/timeout/empty/duplicate | Production ON final19 tests;independent OFF1 test;API tạm backend OFF thật9007 trả404,frontend ON8005 browser fallback PASS |0|PASS within local test scope |
| PDP-T10 | 360px/keyboard/semantic headings | Production PDP cases + mobile commerce regression |0|PASS targeted checks |
| PDP-T11 | Auth/catalog/cart/COD/payment failure/order/inventory | Full HTTP4 tests,full production browser19 tests including existing11 commerce/Home cases;H&M add cart/checkout khi Rec503 |0|PASS |
| PDP-T12 |30RPS60s mixed PDP, p95<800,error<1%,dropped0 | k6 final1 replica732.81ms/48.83%/0;3 replicas1494.61ms/24.00%/5 |1|FAIL / TARGET NOT MET |
| PDP-T13 | Human relevance + public rights | Agent metadata/code review only; no real reviewer/license approval |—|NOT_RUN / PUBLIC NO-GO |
| PDP-T14 | Flags/rollback/remoteCI/PR | Local rollback verified;Draft PR9,API CI9dfd91e success,fullCI code9dfd91e success;review/main merge pending |0 local|PARTIAL until remote review |

Extra checks: backend unit **32/32**, backend lint/typecheck/build exit0; storefront typecheck/build ON/build OFF exit0, lint0 errors/18 existing warnings. Component-only automated accessibility audit/axe, screen-reader audit, browser matrix outside Chromium and randomized long-duration load **NOT_RUN**; targeted keyboard/mobile checks are not a full WCAG certification.

## Commands and logs

Use npm, never a second lockfile. Backend commands use prefix `docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api`:

- `node /app/scripts/hm/run-backend-tests.mjs unit` →32 PASS.
- `node /app/scripts/hm/run-backend-tests.mjs integration:http --silent` →4 PASS/3 suites,101.009s, `data/hm/processed/pdp-verification/backend-http-merged-batch.log`.
- `npm run lint`, `npm run typecheck`, `npm run build` →0; Admin disabled test build.
- Storefront `npm run typecheck`, `npm run lint`, `npm run build` with `.next-pdp-on`/`.next-pdp-off` and flags true/false →0. `next start` ports8003/8004, local fault proxy9006 forwards test Medusa9004.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8003 PDP_FAULT_TESTS=true RECOMMENDATIONS_EXPECT_ENABLED=true npm exec -- playwright test --reporter=list` →18 PASS/1.2m; `full-browser-final.log`.
- OFF build `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8004 PDP_EXPECT_FRONTEND_OFF=true PDP_FAULT_TESTS=false npm exec -- playwright test e2e/pdp-similar-products.spec.ts --reporter=list` →1 PASS/3.2s; `frontend-off-browser.log`.

PowerShell requires `$env:` assignments as in [runbook](../runbook.md); above env-prefix notation describes context, not a copy/paste PowerShell command. Full raw logs stay private. [Load JSON](../evidence/pdp-load-verification.json) contains scrubbed metrics, source paths and SHA256; [offline JSON](../evidence/offline-verification.json) has provenance/coverage.

## PDP performance, not Home

30 contexts rotate deterministically:10 with≥6 similarity candidates,10 sparse,10 zero. All are real mapped Medusa H&M Products and valid in sequential probes; zero similarity does not mean missing/unavailable target. Non-H&M verified separately in browser. Model `pdp-private-v3`,500 Products/1874 variants,3298 run rows. API cap8/test replica, no completed price/inventory cache. Native response values remain authoritative.

| Final profile | p50 ms | p95 ms | p99 ms | HTTP errors | Capacity rejections | Dropped | Iterations / throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
|1 API,isolated after recovery |272.24|732.81|864.23|48.83%|880|0|1801 /29.89 iterations/s |
|3 API,same source |785.59|1494.61|1879.84|24.00%|431|5|1795 /29.65 iterations/s |

Errors are rejected requests, not successful recommendation throughput. Aggregate HTTP latency includes health setup and quick503, so p95 alone cannot establish success; successful-only p95 is776.79ms in final single run. Three API peak capacity cannot be inferred from one60s test. Failed earlier runs retained: initial old compiled runtime1118.86ms/66.81%; later overlapping browser/background runs are diagnostic, not the final isolated profile. Final load scripts add correctness threshold and capacity counter; no SLO threshold was relaxed.

Resource points: earlier isolated1 API154.11% CPU/945.2MiB, PG22.54%/121.8MiB,11/200 connections. During3 API: CPU150.47/154.51/168.98%,RAM496.3/485.3/474.5MiB, PG58.35%/155.5MiB,21/200 connections. Single resource sample is from an earlier isolated run, not final post-recovery run. Not continuous peaks or SQL profiling; cannot attribute latency solely to DB. No SQLSTATE53300 observed in these reported load outputs; no claim it is impossible.

## Failures, fixes and boundaries

Retained failures: interrupted HTTP run during API restart; hidden streaming duplicate locator; Server Action response.finished wait; intermittent cart quantity assertion. Fixed streaming synchronization without deleting assertions; isolated cart rerun2/2 and final full18/18 pass. Performance remains failing after batched fallback/target lookup; no false PASS. Product price/stock not replaced with stale snapshots to improve metrics.

Redis/PG restored in finally; snapshot rollback tested andv3 active. Stop extra replicas after test. Database outage also affects core commerce; only Recommendation failure isolation is asserted when core remains available. No user database drops, volume removal, production fault/load or public dataset upload.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
