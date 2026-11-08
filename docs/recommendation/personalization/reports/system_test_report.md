# Personalization system test report

**2026-11-07, Asia/Saigon · SYSTEM PASS NOT CLAIMED.** Source: branch `recommendation-pdp`, HEAD `cf16e0ba2e2af3519f79f5d1b516708d64a28605` plus uncommitted work. Isolated test Postgres `recommendation-test-postgres` on localhost:5434; Medusa runner created databases named `medusa-…-integration-1`. Main `commerce` was queried read-only and not migrated. Feature flags remained OFF outside the test runner.

| Test area | Command / environment | Actual | Status |
|---|---|---|---|
| H&M aggregate readiness | `python scripts/hm/profile-personalization-readiness.py --output data/hm/processed/personalization/readiness-profile.json` | Exit 0; 979,342 mapped / 31,788,324 raw events; private ignored output | PASS for profiling, not model quality |
| Profiler fixtures | `python -m unittest scripts/hm/tests/test_profile_personalization_readiness.py -q` | 2/2 | PASS |
| Backend units | `npm run test:unit --workspace @dtc/backend` | 43/43 in 6 suites | PASS |
| Consent/event/profile/For You HTTP | `npm run test:integration:http -- personalization-consent.spec.ts` with explicit isolated `DB_HOST=localhost`, `DB_PORT=5434`, test `DATABASE_URL` | 1/1; two users get different top results, duplicate event, spoofed purchase rejection, physical event erasure, A/B isolation; a fixture V2 run did not personalize and V1 was restored | PASS for tested fixture |
| Existing Recommendation + Checkout/Order HTTP | `npm run test:integration:http -- recommendations.spec.ts checkout-order.spec.ts` with same isolated DB settings; then `checkout-order.spec.ts` after adding subscriber assertions | 3/3 combined; final Checkout/Order 2/2 verified order placed, cancellation and removal of canceled interest; simulated payment-failure log is expected | PASS |
| Backend typecheck/lint/build | `npm run typecheck --workspace @dtc/backend`; `npm run lint --workspace @dtc/backend`; `npm run build --workspace @dtc/backend` | Exit 0 each; lint has no issues | PASS |
| Storefront typecheck/lint/build | `npm run typecheck --workspace @dtc/storefront`; `npm run lint --workspace @dtc/storefront`; build with build-only publishable-key placeholder and flags OFF | Exit 0; lint has 18 warnings in pre-existing files | PASS with existing warnings |
| Browser E2E with two accounts and feature ON | Not run | No browser evidence | NOT_RUN |
| Real 500-product catalog and active recommendation run | Not migrated/published on main | Fixture only; current `commerce` lacks recommendation tables | NOT_RUN |
| Order subscriber event/reversal integration | `npm run test:integration:http -- checkout-order.spec.ts` with flags ON in runner-owned DB | Placed and canceled signals observed through real Medusa workflows; canceled interest removed from profile | PASS for fixture |
| Consent concurrency, retention, data export/delete | Not run end-to-end | Policy and engineering gaps | NOT_RUN |
| Load/failure tests | Not run | No p95/RPS/cache/worker claims | NOT_RUN |
| Public rights/legal/privacy approval | Not supplied | Public release remains closed | BLOCKED |

The first HTTP attempt failed during setup because the runner reads `DB_HOST/DB_PORT` separately from `DATABASE_URL`. A retry with `127.0.0.1` also failed because the pinned runner applies SSL unless its URL contains `localhost`. Explicit localhost and test credentials resolved it. A later two-user fixture count assertion failed after adding B's event; the assertion was corrected to expect two before A's withdrawal and one afterward, then the test passed. No assertions were removed or skipped.

Rollback: keep `ENABLE_PERSONALIZED_RECOMMENDATIONS`, `ENABLE_PERSONALIZATION_EVENTS`, `ENABLE_PERSONALIZATION_ORDER_EVENTS`, `ENABLE_PERSONALIZATION_PROFILE_JOB` and both `NEXT_PUBLIC_*` personalization flags OFF. No migration was run on `commerce`; test runner databases are isolated. No checkout or payment code changed.
