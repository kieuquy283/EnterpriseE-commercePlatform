# Phase 01 — Customer identity, consent và data rights

**Mô tả đơn giản:** Chỉ gợi ý dựa trên hồ sơ đúng khách đã cho phép; khi khách từ chối hoặc rút lại, hệ thống không tiếp tục sử dụng dữ liệu cá nhân.

## Dependencies

Phase 00 audit. Medusa customer auth flow, privacy/legal owner.

## Tasks

1. Chốt lawful basis/notice/purpose cho từng nguồn `view/click/order`; người phụ trách xác minh nghĩa vụ pháp lý hiện hành và yêu cầu xử lý/xóa/rút quyền; không suy “đã login = đã đồng ý”.
2. Thiết kế customer-scoped consent state (choice/terms version/changed_at), API đọc/đổi consent, audit và user settings UI. Không có consent cho optional tracking → generic.
3. Lấy `actor_id` **chỉ từ** Medusa `authenticate('customer',...)`; không nhận `customer_id` từ client. Guest P1 chỉ có opaque random ID có hạn TTL dưới policy hợp lệ; không fingerprint.
4. Định nghĩa consent changes: `withdraw` ngắt ingest, invalidate profile/cache lập tức, enqueue erase/retention cleanup; hồ sơ không tự hồi sinh từ old events; grant mới bắt đầu epoch mới.
5. Export/delete request contract, deletion run id/tombstone, retry/reconciliation và minh chứng xóa trong Postgres/Redis/batch snapshot. Retention là policy chốt với owner, không hardcode theo suy đoán.
6. Model/feature anti-cross-user, secret rotation, logging redaction; test nhiều phiên logout/login, account switch, actor spoofing, request concurrent.

## Expected code areas

`apps/backend/src/modules/personalization/` (consent/service/migrations), `apps/backend/src/api/store/...` (consent controls), `apps/storefront/src/...` (privacy setting). **Chỉ là đường dẫn dự kiến**.

## Exit criteria

- [ ] Anonymous/no consent không bị persist tracking, vẫn xem catalog/recs generic.
- [ ] User A không đọc/đổi consent/profile user B.
- [ ] Withdrawal immediate effect; eventual erasure tested end-to-end with audit evidence.
- [ ] Legal/privacy decision and retention recorded; all data remains private pending approval.

**Report:** `reports/phase_01_report.md` (commands/test/actual status, privacy threat model, rollback).
