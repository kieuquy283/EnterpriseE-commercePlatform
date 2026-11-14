# Storefront conventions

Read the repository root AGENTS.md and the canonical specification. The app is Next.js 15 / React 19, not a separate commerce authority.

- Put commerce access in `src/lib/data` through the Medusa SDK/API. Validate server actions; send the publishable key and verified customer token as appropriate.
- Display backend prices, shipping, discounts and availability. Complete Medusa carts; do not independently create orders or compute authoritative totals.
- Keep auth/cart cookies HTTP-only and secure in production. Never share/cache personalized responses as public data.
- A caching change must specify key context, TTL, invalidation and behavior across replicas. Price/stock display freshness is separate from checkout validation.
- Prefer existing components. New product copy must fit DAYMARK's everyday-clothing identity. Do not rename package identifiers for marketing or copy third-party brand assets.
- Run `npm run lint`, `npm run typecheck` and relevant Playwright tests (`npm run test:e2e`) from this directory. E2E needs a prepared isolated backend/catalog. A passing build is not proof of a completed browser journey.
