# Phase 06 — Serving API & storefront

**2026-11-07 · PARTIAL.** Added authenticated `/store/recommendations/for-you` with no `customer_id` query, private/no-store response, bounded 12-card limit, Medusa region/channel/pricing/inventory filtering, generic fallback and concurrency cap. Added server-side Next.js fetch, Home “For you” rail, account consent control, PDP view and rail click tracking. All frontend/backend feature flags default OFF. No change to Cart/Checkout logic.

Two-user HTTP integration test passed on fixture products; unauthenticated/unknown query paths were checked. `npm run typecheck --workspace @dtc/storefront` exited 0. Storefront lint exited 0 with 18 warnings from existing files, none in new personalization files. Storefront build initially failed because the pre-existing config requires `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`; retry with a non-secret build-only placeholder and personalization flags OFF exited 0. Backend build exited 0.

**Unmet:** browser E2E with feature ON and two real local accounts, mobile/accessibility check, image/price validation on the 500-product catalog, guaranteed click delivery during navigation, request timeout and mixed-user performance. Main `commerce` has no active recommendation tables/run; this is not a live deployment claim.

Rollback: turn off frontend/backend personalization flags; existing Home Popular Products and PDP remain available.
