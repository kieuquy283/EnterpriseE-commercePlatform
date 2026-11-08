# Phase 04 — Behavioral Personalized MVP ranker

**Mô tả đơn giản:** Dùng hồ sơ sở thích và thuật toán V1 metadata để chọn sản phẩm phù hợp từng khách, chưa cần huấn luyện ML.

## Dependencies

Phase 03 profiles + verified V1 metadata/Popularity candidate pipeline.

## Tasks

1. Reuse `recommendation_candidate` global V1 top-K *as item-to-item candidate inputs*; do not add raw `customer_id` into global candidate context keys. Use recent viewed/clicked/purchased to expand candidate union + category-affinity + popularity fallback.
2. Define explicit score contributions / normalization / decay before tuning; compare `Popularity`, `recent-item-only`, `category-affinity`, `behavioral hybrid` on identical QA/test users; no pretend offline accuracy from synthetic fixtures.
3. Implement dedup, bounded candidate cap, deterministic ties, already-purchased policy and diversity; do not use V2 CLIP until separate quality gate. Fallback `no_consent|cold_start|stale_profile|service_unavailable` to non-personal generic results.
4. Test score calibration and recency, events spoof/spam, empty/all-filtered, invalid products, deleted/discontinued/cross-channel/out-of-stock. Avoid N+1 Medusa product fetch.
5. Plan feature versioning and rollback, comparison of requested/actual strategy, no serving raw scores or histories to client.
6. Use *existing candidate publish version* and pinned item taxonomy; if input V1 changes, explicit profile/ranker version follows.

## Exit criteria

- [ ] Two QA synthetic customers with distinct valid histories get appropriately distinct top-K when eligible.
- [ ] Identical input/config yields identical output; no self/duplicate, correct fallback.
- [ ] Does not require Python/OpenCLIP at HTTP request time.
- [ ] No adverse commerce behavior when ranker unavailable.

**Report:** `reports/phase_04_report.md` with test profiles, rank-explanation aggregate, fallback decisions.
