# Phase 03 — Customer / Session interest profiles

**Mô tả đơn giản:** Biến một chuỗi sự kiện thành hồ sơ sở thích nhỏ gọn: gần đây khách quan tâm nhóm áo, màu hoặc sản phẩm nào, dựa trên dữ liệu được phép xử lý.

## Dependencies

Phase 02 events, Phase 01 consent and deletion model; product taxonomy access from V1.

## Tasks

1. Thiết kế `recommendation_profile` với `category_affinity`, `recent_product_ids`, permitted purchases, `profile_version`, `source_event_watermark`, freshness; field typed, bounded storage.
2. Aggregator chạy repeatable/idempotent (job/worker); weights initial view=1/click=2/purchase=5, 14-day half-life are proposed **not optimized**; cap spam/repeated views and avoid customer overrepresentation.
3. Handle expired events, cancellation, withdrawn epoch, deleted user, product removal and profile invalidation. Do not regenerate from suppressed history; update with source cursor/watermark to avoid missed/duplicate events.
4. Optional Redis profile cache scoped by consent epoch/actor, TTL, encrypted/pseudonymous; Postgres remains authoritative. Cache miss/down → on-demand bounded read or generic rather than cross-user stale result.
5. QA fixtures: user A likes shirts and user B likes dresses, empty user, expired events, 1 event, 1000 repeated views, deleted account, 2 simultaneous workers.
6. Document planned quality: freshness p95, coverage % of consented customers with 2+ qualifying events, aggregation latency and cost. Do not extrapolate website traffic from Kaggle user counts.

## Exit criteria

- [ ] Deterministic profiles for same ordered event multiset and configuration.
- [ ] No profile for revoked/deleted actor; cache invalidation verified.
- [ ] Two distinct histories yield appropriately different preferences without cross-user data.
- [ ] Aggregation can replay without double counting and has bounded queries/memory.

**Report:** `reports/phase_03_report.md` with fixture hashes, tests, staleness metrics.
