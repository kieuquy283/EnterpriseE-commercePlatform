# ADR-012 — Idempotency và notification test gate

- **Ngày:** 2026-11-22
- **Trạng thái:** Proposed
- **Người quyết định:** Backend, architecture owner, QA
- **Bối cảnh:** Checkout, worker notification và các thao tác lặp có thể timeout, trùng request hoặc provider gián đoạn. Đã có cơ chế Medusa cho một số replay/cart completion, nhưng BE-07 cần quy tắc test gate rõ ràng và không coi evidence từng phần là exactly-once.

## Quyết định đề xuất

1. **Ưu tiên extension point và giao dịch Medusa gốc.** Không tạo repository/API/order/payment duplicate. Workflow, module, middleware và provider sử dụng extension point framework.
2. **Idempotency theo intent hoặc event, không theo HTTP retry mù.** Checkout/complete phải đối soát intent, cart/collection/order và stock; notification dùng dedupe key event/state/channel/template.
3. **Retry sau timeout đọc lại nguồn.** Không giả request vẫn chạy hay đã commit; reconciliation xác nhận effect trước khi quyết định replay, success hoặc failure.
4. **Không exactly-once.** Hệ thống chống trùng và đối soát nghiệp vụ; timeout/provider ambiguity cần quan sát được, provider reference và attempt record.
5. **Notification không đổi nguồn nghiệp vụ.** Event trùng/cũ/sai thứ tự bị bỏ; provider failure làm trạng thái notification thay đổi, không làm đơn/fulfillment thành công giả.
6. **Mỗi thay đổi backend có test gate.** Unit và HTTP chạy success/failure; auth negative và worker failure không thay thế nhau; test nonprod chỉ mô phỏng provider.

## Hệ quả

- BE-03 payload mismatch cần intent key/payload hash nếu retry payload khác được coi là vi phạm.
- BE-04 notification policy có thể cung cấp cột mốc và retry, nhưng chưa bằng chứng notification production.
- Migration/DTO/test/rollback phải nằm trong PR.
- Cổng không sử dụng build/lint/typecheck duy nhất như bằng chứng luồng.

## Fitness check

- [BE-07 evidence](../../report/be-07-backend-test-evidence.md): PR head, lệnh, assertion, environment và artifact.
- [BE-03 duplicate/retry/concurrency](../../report/be-03-duplicate-retry-concurrency.md).
- [BE-04 notification test](../../report/be-04-notification-test-report.md).
- [ADR-003](ADR-003-order-inventory-consistency.md) và [ADR-004](ADR-004-payment-state-and-cod.md).

**Xem lại khi:** có Medusa/version mới cung cấp intent/payload hash chuẩn, provider thật có dedupe/chính sách refund, hoặc notification production được cấu hình và chịu ngân sách/entitlement.
