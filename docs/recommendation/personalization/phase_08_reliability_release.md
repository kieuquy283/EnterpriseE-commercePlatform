# Phase 08 — Reliability, Security, Privacy & Release

**Mô tả đơn giản:** Trước khi bật cho khách thật, kiểm tra hệ thống chịu tải, bảo mật hồ sơ từng người và không làm hỏng các chức năng mua hàng.

## Dependencies

Phase 01–04, 06–07, legal/privacy sign-off, isolated test environment; Phase 05 optional.

## Tasks

1. Full Python, backend unit/integration, E2E browser, typecheck/lint/build; Auth, Product, Cart, Checkout/Payment, Order, Inventory, existing Home/PDP Recommendation regression.
2. Security tests: attacker passes `customer_id`/token changes/second-user cookies, cache key scopes, stale sessions/logout, URL/query logs, forced consent, CSRF/origin/rate limits, anonymous event abuse, credentials leak.
3. Privacy/deletion tests: revoked consent stops capture, destroys derived profile + Redis keys, future replay cannot recreate; expiration and export/deletion flow. Audit separate lawful order retention vs optional rec features.
4. Reliability: Redis down, event worker lag, profile DB failure (if independent), candidate unavailable, commerce DB down; correct fallback vs 503 semantics, no false successful commerce response. Version rollback/idempotent retraining and activation.
5. Load: 10 RPS private smoke, 30 RPS target (auth mix/many users), p50/p95/p99 success-only, reject rate, errors, CPU/RAM/PG connections, profile lag; only claim targets actually met. Shared PDP hydrator is known bottleneck; avoid relying on single hot-cache Home benchmark.
6. Operational docs: feature flags, nightly jobs, backups, retention/delete, alerts, runbook, incident/rollback, cost budget; separate PRIVATE and PUBLIC GO/NO-GO. Avoid customer behavior in docs, logs and repos.

## Exit criteria

- [ ] Full correctness/security/consent/erase/system tests PASS, or honest `NOT_MET/BLOCKED`.
- [ ] Quantified load profile reaches agreed threshold; no 503 improvement claimed merely because request is fast to reject.
- [ ] Feature OFF leaves commerce functioning; rollback demonstrated safely in isolated DB.
- [ ] Public rights/privacy governance sign-off separate and explicit; no auto publication.

**Reports:** `reports/phase_08_report.md`, `reports/system_test_report.md`, `reports/final_implementation_report.md`.
