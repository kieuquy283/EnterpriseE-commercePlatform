# Storefront editorial redesign validation — 15 November 2026

Implementation on the existing `feat/daymark-storefront-catalog` shared working tree based on `19e767e`. Inherited catalog and commerce fixes were preserved. No commit, push, PR, deployment, cloud change or shared database write was performed.

## Environment and scope

Node 24.22.1, available npm 11.19.1; root packageManager remains npm 11.12.1. No dependency installation was needed. Existing isolated backend/storefront processes use ports 19000/18000, PostgreSQL 16 on 55439 (`daymark_catalog_disposable`) and Redis 7 on 56389. Browser purchase tests create synthetic customers/carts/orders only in this disposable environment. No backend source or importer was changed by this redesign pass.

## Evidence for this pass

- Storefront ESLint: passed with no reported issues.
- Storefront TypeScript: passed.
- Storefront production build: passed compilation, lint/types, page generation and tracing.
- Selected catalog, cart, COD checkout, mobile, account/history and design coverage: all 16 tests passed across the final runs (13 non-account checks in the combined run, then 3/3 account checks after the streamed-login locator correction). An earlier complete 15-test run also passed before the final primitive audit. These exercise variant selection without document/RSC navigation, add/update/remove cart items, required address validation, guest COD order creation, injected order failure and owned account order history.
- Extended design checks: 6/6 passed, including no-JavaScript home visibility and mobile/desktop overflow coverage across store, category, collection, PDP, cart, account and missing-page routes, plus computed button geometry equality across hero/catalog/account/PDP. The first attempt exposed an inherited broad loading boundary; moving its skeleton into a reusable template resolved the hidden home content.
- Shared preview review: inspected desktop collection split image/type composition, full-bleed home collection row, desktop/mobile PDP and mobile home/account forms. Real collection photos loaded; PDP honestly displays its missing-photo fallback.

```sh
PLAYWRIGHT_BASE_URL=http://localhost:18000 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/home/thang/.nix-profile/bin/helium \
npm run test:e2e --workspace=@dtc/storefront -- \
  catalog.spec.ts cart.spec.ts checkout-cod.spec.ts responsive-mobile.spec.ts \
  account-order-history.spec.ts design-system.spec.ts
```

These are local Chromium observations, not production acceptance. COD order creation does not verify delivery or cash collection. Personalized/HM recommendation features stayed disabled; no new live recommendation acceptance is claimed. Safari/Firefox, load performance, staff fulfillment, notification delivery and production services were not tested. Exact product photography and measured garment sizing remain gaps. The catalog import and earlier backend test evidence belong to their preceding work; they were not rerun for this frontend-only change.

Oxfmt checked all 176 changed/untracked storefront source and E2E files successfully. Documentation and whitespace checks passed. The final primitive audit removed the hero-only pill CTA, circular arrow badge and page-specific icon/option geometry. An intermediate build caught a leftover size variable during consolidation; it was corrected and build/type checks passed afterward. A browser run exposed transient hidden streamed login copies; account assertions now target the visible main login form, retaining all credential, registration and owned-order checks. The final account rerun passed 3/3, including registration, COD order creation and owned history/details. Shared preview also inspected the unified hero CTA at desktop and 375px mobile widths. Browser tabs opened for inspection were closed.

## Local preview

[Storefront](http://localhost:18000/vn), backed by the existing isolated backend at `http://127.0.0.1:19000`. The review launcher is temporary and outside the repository. Normal application configuration and root lockfile are preserved.

## Catalog image completion addendum — 15 November 2026

Four selected real clothing photos now replace both landing-header images and the Workday and Daily Essentials covers. The seeded catalog separately serves 30 representative product images through the isolated Medusa local provider. Browser checks confirmed all four landing/collection photos loaded; the focused design-system suite passed 7/7 after adding image-load assertions. Storefront lint and type checking passed. The earlier 16-test selected commerce run also passed, including completed guest COD orders. Importer dry-run and two local image applies reported 30 planned/uploaded images followed by 30 skipped existing images with no pending work; existing stock, customer and order aggregates stayed unchanged across those imports.

## Final diff review — 15 November 2026

Before preparing the draft PR, the integrated diff was reviewed and local Medusa uploads were excluded from Git. Unused procedural artwork studies and their generator were retained in the ignored `.tmp/daymark-editorial-studies/` archive, outside shipped assets. The importer inventory workflow now submits only missing levels, removing an unused update array; existing quantities remain untouched.

Fresh checks passed: storefront ESLint, TypeScript and full production build; backend Medusa lint, TypeScript and all 121 unit tests across 13 suites; Oxfmt for all 210 changed source/document files; documentation links and `git diff --check`. Browser suites and isolated import evidence above were not rerun during this final source review. No shared database or cloud operation was performed. Commits and a draft PR are authorized for this review pass.
