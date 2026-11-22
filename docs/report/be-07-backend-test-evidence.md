---
document_id: REPORT-BE-07-EVIDENCE-01
title: BE-07 Backend test evidence
version: 1.0.0
status: PARTIAL
owner: Backend
last_updated: 2026-11-22
related_documents:
  - ../technical/be-07-api-adr-handover.md
  - ../06-architecture/adr/ADR-012-backend-test-idempotency-notification.md
  - api-boundary-regression-2026-11-18.md
  - be-03-duplicate-retry-concurrency.md
  - be-04-notification-test-report.md
---

# BE-07 — Bằng chứng kiểm thử backend

## Trạng thái

**PARTIAL — có bằng chứng cho regression API, concurrency và notification; chưa có gói bằng chứng BE-07 đầy đủ cho lint/typecheck/unit/HTTP trên toàn bộ PR, auth-negative Staff/Admin và worker-error chạy tại cùng revision.**

## Kết quả đã có

| Lớp kiểm thử | Kết quả | Yêu cầu đã nối | Bằng chứng |
|---|---|---|---|
| API boundary/auth regression | PASS cho 24 assertion mục tiêu của cart/checkout ngày 18/11 | FR-AUTH, FR-CART, FR-CHK | [BE-01 API boundary report](api-boundary-regression-2026-11-18.md) |
| Duplicate/retry/concurrency | PASS: duplicate complete và stock contention; PARTIAL: payload mismatch chưa có intent key riêng | FR-CHK, FR-PAY, FR-INV, NFR-REL-01 | [BE-03 report](be-03-duplicate-retry-concurrency.md) |
| Notification unit/HTTP | PASS: event trùng, sai thứ tự, retry và failed worker | FR-NOT, NFR-NOTIFY-01 | [BE-04 report](be-04-notification-test-report.md) |
| Staff/Admin role-negative | NOT RUN/BLOCKED | FR-ADM, PERM-001..005 | [BE-08 role-negative report](be-08-role-negative-http-browser-test-report.md) |
| Worker-error end-to-end đồng revision | NOT RUN | FR-NOT, NFR-REL-01 | Chưa có evidence bundle |

## Bằng chứng cần gắn cho mỗi PR backend

Mỗi PR phải lưu cùng thay đổi:

- Commit SHA và phiên bản ảnh/container đã chạy.
- Mục tiêu FR/NFR và luồng bị ảnh hưởng.
- Lệnh lint, typecheck, unit và HTTP; kết quả từng lệnh, không gom thành verdict chung.
- Success và failure assertion.
- Auth-negative 401/403 và kiểm thử đối tượng khách/worker.
- Simulator non-production; không có simulator trong production.
- Worker error, retry và reconciliation.
- Migration/module/DTO impact hoặc ghi `N/A`.
- Rollback, compatibility và known limitations.

Không dùng kết quả lịch sử thay cho revision của PR. Mọi database/Redis dùng cho test phải disposable và được đối soát trước/sau.

## Cổng BE-07

- PASS chỉ khi lint/typecheck/unit/HTTP chạy trên cùng PR head hoặc blocker được ghi rõ.
- Auth-negative và worker-error không được thay bằng typecheck hoặc build.
- Một route/test được thêm không đủ; thay đổi cần có code→test→requirement mapping.
- Chưa có evidence artifact của role-negative hoặc worker-error nên BE-07 không được tuyên bố Done.

