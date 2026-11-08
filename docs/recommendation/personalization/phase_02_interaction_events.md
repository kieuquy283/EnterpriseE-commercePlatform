# Phase 02 — Interaction collection & authoritative commerce events

**Mô tả đơn giản:** Ghi lại các tín hiệu sở thích hợp lệ để engine biết người dùng quan tâm gì; phân biệt click/view từ browser và mua hàng thật từ Medusa.

## Dependencies

Phase 01 consent + identity. Isolated test DB. Medusa Event Bus/subscriber patterns verified for exact installed version.

## Tasks

1. Xây schema có `event_id`, subject key, event type, product id, timestamps, source, consent epoch, rec placement/version, expiration + dedup constraints (xem [spec](spec.md)). Không lưu email/cookie/IP fingerprint.
2. Frontend emit tối thiểu `product_view`, `recommendation_click`; instrumentation `recommendation_impression` nếu thực sự cần CTR và có consent. Validate origin, event IDs, product IDs, time skew, rate-limit/bot protections, throttled repeats; không ghi khi opt-out.
3. Server event ingestion chỉ nhận allowlist, chịu timeout/backpressure, trả 202/4xx; không chặn render/Product Detail hay checkout nếu queue hỏng.
4. Medusa `order.placed` subscriber + order readback để tạo verified `purchase`; handle `order.canceled`/return/refund state bằng compensation theo business logic. Idempotency keyed order+line_item+event/state; replay/duplicates no double count. Không nhận `purchase` từ browser.
5. Chọn job/queue vận hành tối thiểu dựa trên Redis Event Module hiện có, hạn chế số connection, dead-letter/retry; verify owner of DB và migrations.
6. Unit/integration tests: duplicate browser events, spoofed purchase, replay order, cancellation, out-of-order message, Redis outage, consent withdrawn mid-flight, load/abuse.

## Exit criteria

- [ ] Real synthetic Medusa test Order contributes exactly once and reverses appropriately.
- [ ] Forged client purchase cannot change profile; event ingestion never blocks commerce.
- [ ] Withdraw stops future writes, dedup/retry/backpressure observable.
- [ ] Event schema and migrations tested in disposable DB, never main commerce reset.

**Report:** `reports/phase_02_report.md` with event counts only in aggregates, no raw customer traces.
