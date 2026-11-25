# BE-04 — Báo cáo kiểm thử thông báo khách hàng

## Phạm vi

Báo cáo này bao gồm outbox BE-04, chính sách subscriber, provider sandbox, retry hữu hạn và xử lý sự kiện trùng cho thông báo đơn hàng.

## Môi trường

- Ngày: 22/11/2026
- Nền tảng: Windows + Docker/PostgreSQL cơ sở dữ liệu integration
- Medusa: 2.21.2
- Nhánh: `backend/w1`
- Provider: sandbox email

## Lệnh kiểm thử

```sh
npm run test:unit --workspace=@dtc/backend -- notification-policy.unit.spec.ts
npm run test:integration:http --workspace=@dtc/backend -- notification-outbox.spec.ts
npm run typecheck --workspace=@dtc/backend
npm run build --workspace=@dtc/backend
```

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Unit test chính sách sự kiện placed/canceled sai thứ tự | PASS — 3 test |
| Sự kiện trùng tạo một outbox record và một attempt thành công | PASS |
| Provider down -> retry_wait -> provider phục hồi -> sent | PASS |
| Provider down lặp lại đến bốn attempt -> failed với lỗi cuối | PASS |
| Typecheck backend | PASS |
| Build Medusa backend | PASS |

## Bất biến đã quan sát

- Lỗi thông báo không thay đổi trạng thái đơn hoặc fulfillment.
- Sự kiện trùng tái sử dụng dedupe key duy nhất.
- Sự kiện placement/cancellation sai thứ tự bị lọc theo trạng thái đơn hiện tại.
- Lỗi provider tạo attempt record và lịch retry hữu hạn.
- Lần lỗi provider thứ tư để lại bản ghi cuối quan sát được ở trạng thái `failed`.
