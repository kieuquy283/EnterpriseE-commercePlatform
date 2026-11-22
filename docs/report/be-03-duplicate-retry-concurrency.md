# BE-03 — Duplicate, retry, timeout va tranh chap ton

- Ngay: 2026-11-22
- SHA: `406da58`
- Muc tieu: xác minh duplicate/timeout/payload mismatch va tranh chap 5 don vi ton
- Trang thai tong the: **PARTIAL**

## Kết quả

| Ca kiểm thử | Kết quả | Bằng chứng |
| --- | --- | --- |
| Hai `complete` cùng cart đồng thời | PASS — chỉ tạo 1 Order và 1 Payment effect; lần thứ hai là replay cùng Order | [duplicate-completion.json](evidence/be-03-2026-11-22/duplicate-completion.json) |
| Retry sau commit và payload khác nhau | PARTIAL — retry nhận cùng Order, không tạo hiệu ứng trùng; Medusa core không có cơ chế từ chối payload khác cho cùng intent | [timeout-payload-retry.json](evidence/be-03-2026-11-22/timeout-payload-retry.json) |
| 20 attempts cho 5 đơn vị available | PASS — 5 Order, 5 Payment effect và 5 reservation; 15 attempt bị phân loại stock conflict | [reconciliation.json](evidence/be-03-2026-11-22/reconciliation.json), [reconciliation.csv](evidence/be-03-2026-11-22/reconciliation.csv) |

## Lệnh xác minh

```sh
npm run typecheck --workspace=@dtc/backend
npm run test:integration:http --workspace=@dtc/backend -- be-03-concurrency.spec.ts
```

Kết quả:

- Typecheck: PASS.
- HTTP suite: PASS, 1 suite/3 tests, 77.8 giây; mỗi test chạy trên DB disposable.

## Phân loại lỗi

- `stock_conflict`: HTTP 400 `not_allowed`, thông báo không đủ tồn.
- `idempotent_replay`: retry trả cùng Order ID, không tạo Order/Payment/Reservation mới.
- `payload_mismatch_unenforced`: request retry có payload khác nhưng Medusa core vẫn replay cùng cart/Order; chưa có intent key/payload hash riêng.
- Timeout sau commit được mô phỏng bằng replay ngay sau lần complete thành công; không mô phỏng transport socket timeout.

## Đánh giá extension

Medusa core đáp ứng duplicate cart completion và tranh chấp tồn bằng transaction/state hiện có. Không thêm workflow hay model idempotency riêng trong thay đổi này.

Payload mismatch chưa được chấp nhận như một giao dịch có intent key trong core route. Đây là gap cần quyết định: nếu payload được coi là miền checkout/intent cần bắt buộc, thêm idempotency key/payload hash ở workflow hoặc route trước khi tuyên bố full PASS. Không ghi đè bảng/giao dịch lõi bằng SQL.

## Căn chỉnh điều kiện Done

- Không tạo hai Order/Payment effect cho cùng intent được cart: PASS.
- Không oversell và reservation khớp: PASS trên fixture 20 attempts/5 units.
- Failure phân loại rõ theo domain: PASS; payload mismatch được ghi rõ là chưa bị enforcement.
