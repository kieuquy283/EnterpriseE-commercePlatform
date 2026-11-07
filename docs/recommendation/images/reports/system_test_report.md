# H&M image pipeline — system test report

> **Update, 2026-11-06:** Real-image acquisition and isolated Medusa API readback have now passed for 496/500 Products. Browser E2E on isolated `localhost:8001` passed 4/4 with actual Kaggle JPEGs, including Home. Main `localhost:8000` integration remains NOT_RUN. See [new evidence](real_hm_images_2026-11-06.md); the matrix below captures the preceding fixture-only run.

Executed 2026-11-06 Asia/Saigon on `recommendation-pdp`, baseline SHA `452799380adb9745c1c3f480c484df20761f0970`, uncommitted task changes. Windows host, Python 3.10, Node 24, Medusa 2.21.2, Next.js 15.5.24, PostgreSQL 16. Main `commerce` DB was used only for read-only counts and storefront reads; dedicated `recommendation-test` DB was started for synthetic fixture writes only. Private inputs/outputs stay in ignored `data/hm/`.

| Area | Expected | Actual evidence and command | Status |
| --- | --- | --- | --- |
| Manifest | Unique Product/Variant/image path mapping | `python scripts/hm/build-image-manifest.py` exit 0; 500 Products, 1,874 Variants, 500 representatives | PASS local artifact |
| DB reconciliation | Every mapped ID read back via Medusa | `docker compose exec -T postgres psql ...` read-only counts exit 0: 500 Products and 1,874 Variants; exact ID-by-ID readback NOT_RUN | PARTIAL |
| Kaggle acquisition | 10–20 authorized real assets | `kaggle competitions files -c ...` returned 401; `python scripts/hm/download-images.py --limit 1` exit 1, 0 bytes/0 downloaded | BLOCKED |
| Resume/ZIP/failure | No duplicate download, safe extraction, failure report | Python fixture tests; full `python -m unittest discover -s scripts/hm/tests -v` exit 0, 17/17 | PASS fixture |
| Image validation | All accepted real JPEGs decode | `python scripts/hm/validate-images.py` exit 0: 1,874 missing, 0 valid/corrupt; valid and corrupt fixture tests PASS | BLOCKED real / PASS fixture |
| Optimization | Real derivatives, size and quality | `python scripts/hm/optimize-images.py` exit 0: 0 real derivatives; large/small fixture and repeat tests PASS | BLOCKED real / PASS fixture |
| Import safety | Prevent commerce DB, non-loopback and cloud storage writes | `npm run test:unit --workspace @dtc/backend` final exit 0, 37/37 including 5 guard tests | PASS |
| Medusa fixture import/readback | Correct Product/Variant association and media URL | `python scripts/hm/create-image-test-fixture.py` exit 0; guarded `medusa exec ./src/scripts/import-hm-images.ts` on `recommendation_test` exit 0, 1 Product updated; Store API 200, thumbnail true, gallery 1, JPEG HTTP 200/4,834 bytes | PASS fixture |
| Import idempotency/rollback | No gallery duplicate; restore previous media | Importer rerun exit 0, 0 Products updated; guarded `medusa exec ./src/scripts/rollback-hm-images.ts` exit 0, 1 restored; Store API 200, thumbnail false, gallery 0 | PASS fixture |
| Real H&M Medusa import | 500 mapped Products with valid assets | No authorized H&M JPEGs; 0 real Products imported | BLOCKED |
| Backend unit regression | Existing Recommendation and new guard | `npm run test:unit --workspace @dtc/backend` final exit 0, 37/37 in 4 suites | PASS |
| Backend typecheck/lint/build | No new errors or Medusa lint warnings | Final `npm run typecheck --workspace @dtc/backend` exit 0; final `npm run lint --workspace @dtc/backend` exit 0, no issues after 11 warnings fixed; final `npm run build --workspace @dtc/backend` exit 0 (backend and Admin bundle) | PASS |
| Frontend typecheck/lint/build | Production compile | `npm run typecheck --workspace @dtc/storefront` exit 0; lint exit 0 with 18 pre-existing warnings; build final exit 0 with valid DB publishable key | PASS |
| Missing-image browser | Desktop/mobile PDP and cards usable | `npm run test:e2e --workspace @dtc/storefront -- e2e/hm-image-fallback.spec.ts` against isolated port 8002: exit 0, 2/2 (1280px, 360px) | PASS |
| Catalog/PDP regression | Product and variants usable | `npm run test:e2e --workspace @dtc/storefront -- e2e/catalog.spec.ts` against port 8002: exit 0, 1/1 | PASS |
| Similar Products fixture API | Recommended Product owns its thumbnail | `python scripts/hm/verify-image-test-serving.py` against test API port 9002 exit 0: 6 recommendations, target thumbnail equals Store Product thumbnail; JPEG URL 200 | PASS fixture |
| Image browser E2E | Card and target PDP gallery load mapped asset | `npm run test:e2e --workspace @dtc/storefront -- e2e/hm-image-serving.spec.ts` against test storefront port 8001 final exit 0, 2/2; card and gallery image `naturalWidth > 0` in loaded case | PASS fixture |
| Real H&M image/card/gallery | Correct Product image, URL and origin | No real images; browser assertions NOT_RUN | BLOCKED |
| Broken URL fallback | URL fails in browser | Playwright intercepted `/static/` JPEG with network abort; card/gallery showed placeholders and PDP add-to-cart remained visible, same 2/2 suite | PASS fixture |
| Cart/Checkout/Payment/Order/Inventory | No commerce regression | Mutating E2E tests intentionally NOT_RUN on main DB; no isolated image DB populated | NOT_RUN |
| Performance/storage | Before/after image bytes, latency, resource use | Real image bytes 0; no relevant benchmark possible | NOT_RUN |
| Security | No assets/secrets in Git | `.gitignore` matches `data/hm/`; `git diff --check` exit 0; targeted hardcoded-secret scan returned no hits. No image or credential committed | PASS scope |

Build debug: first frontend build exited 1 because local `.env.local` has an empty publishable key; second build compiled but browser middleware got 400 with a key from the separate test DB; the final build used a valid key obtained from the main DB through a read-only query (never printed) and exited 0. The resulting PDP returned HTTP 200 before Playwright. The test server was stopped; task-generated build output and Playwright tracked report modifications were cleaned/restored. No failure was suppressed.

Fixture test debug: Docker Engine stopped unexpectedly once during an optional follow-up API request. Docker Desktop was restarted; `recommendation_test` still contained 500 H&M Products. The isolated stack was restarted, Similar Products API and browser fixture test passed, media was rolled back, and test containers were stopped without deleting DB or volumes. Main commerce containers auto-restarted. This disruption is not counted as a successful test.

Data/image coverage: 500/1,874 mapping artifacts; 1,874 expected real JPEGs; 0 real downloaded/validated/optimized/uploaded and 1,874 missing. Separately, 1 synthetic fixture article, 2 derivatives, 1 Product temporarily updated, 2 File Module uploads, then Product media rolled back. The fixture Product was reattached for API/browser tests and rolled back again. Static fixture files remain in ignored private test storage; no real Product media URL exists from this task. Main commerce DB was not written.

Rights: [Kaggle competition data](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/data) is subject to [competition rules](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/rules). Public hosting and redistribution remain NO-GO. See [phase 00](phase_00_report.md).

**System verdict: PARTIAL.** Fixture upload/readback/rollback and code regression tests pass; real acquisition, real-image browser mapping, commerce mutation regression and performance are BLOCKED/NOT_RUN.
