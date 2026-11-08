# Phase 06 — Medusa personalized serving API & Next.js UI

**Mô tả đơn giản:** Đưa danh sách riêng cho đúng khách lên trang chủ, nhưng giữ mọi kiểm tra giá, hàng và quyền truy cập như website hiện tại.

## Dependencies

Phase 01 identity/consent, 03 profile, 04 ranker; Medusa Recommendation StoreProduct resolver and Next ProductPreview. Phase 05 optional, not a requirement.

## Tasks

1. Additive `GET /store/recommendations/for-you?region_id=...&limit=12` using optional customer authentication on pinned Medusa v2; derive actor **only** server-side; reject `customer_id` query. No request body credentials or untrusted profile identifiers.
2. Use existing StoreProduct region/channel/published/price/inventory/backorder filtering; cap candidate fetch and batch; exclude cross-currency/unpriced, invalid/unknown products, duplicates. Avoid extra native Store API round-trips per candidate.
3. Privacy-safe response with `personalized`, `strategy`, `reason`, `version`, `products`; `Cache-Control: private, no-store`, no user-event data/scores, no cross-user coalescing. Generic fallback if not opted in/empty/stale/error.
4. Add `For You` rail on Home or Account and logged-in preference toggle; guest no-consent sees clearly generic section, no confusing “specially for you” claim. Reuse `ProductPreview`, region+price and placeholder images.
5. Feature flags separate collection/profile/serving/UI, default OFF; explicit account switching/log out invalidates caches; E2E at 360px and desktop, browser failures never block PDP/cart.
6. Benchmark **many distinct authenticated users**, mixed 10/30 RPS profiles; note existing PDP 30 RPS capacity failure and shared hydration bottleneck. Measure successful-only p95 separately from 503. Fix bottlenecks rather than relaxing thresholds to fake PASS.

## Exit criteria

- [ ] Logged-in opt-in A sees only A's history-based recommendations, B sees only B's.
- [ ] Anonymous/opt-out has generic fallback, no per-user cache leak, no auth errors.
- [ ] All returned Product IDs are valid/saleable for region and channel.
- [ ] Tests cover feature ON/OFF, unavailable dependencies, price/stock, 400/401/404/503 and mobile.

**Report:** `reports/phase_06_report.md` with real API responses redacted, latency and E2E results.
