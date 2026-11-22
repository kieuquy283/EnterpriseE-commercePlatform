# BE-07 — API, ADR và bàn giao backend

## Phạm vi

Tài liệu bàn giao này tóm tắt hợp đồng API/lỗi, idempotency, notification, migration/DTO và điều kiện rollback của thay đổi backend. [ADR-012](../06-architecture/adr/ADR-012-backend-test-idempotency-notification.md) là quyết định kỹ thuật; [evidence BE-07](../report/be-07-backend-test-evidence.md) ghi trạng thái kiểm chứng.

## API và error response

- Route Medusa export đúng GET/POST/DELETE; mutation thuộc workflow, không gọi module service trực tiếp từ route.
- Input phải có runtime validation; TypeScript/DTO không thay validation.
- 401 cho danh tính chưa xác thực; 403 hoặc 404 không tiết lộ theo hợp đồng endpoint đã cài; 404 cho đối tượng không thấy.
- Stock/state/idempotency conflict phải giữ mã xung đột thực của endpoint và không đổi mã chung mù quáng.
- Provider/downstream failure không báo đơn thành công khi kết quả chưa có thẩm quyền; response không lộ stack trace, provider payload, credential hoặc thông tin khách.
- Custom response DTO chỉ chiếu field công khai; auth identity lấy từ server context, không tin `customer_id` do client gửi.
- Correlation ID/log masking là mục tiêu đã biết; không coi đã thực thi toàn chuỗi khi chưa có bằng chứng.

Chi tiết hợp đồng hiện tại thuộc [data/API](../spec/04-data-api.md).

## Idempotency và notification

- Checkout/thanh toán và notification dùng dedupe theo intent/event/state phù hợp; không coi cache frontend là idempotency.
- Retry sau timeout đọc lại cart/collection/order/stock trước khi thử lại.
- Sự kiện trùng hoặc sai thứ tự không tạo hiệu ứng trùng.
- Notification lỗi không thay đổi order/fulfillment đã chốt.
- Provider timeout chưa rõ kết quả phải đối soát provider; không ghi `sent` chỉ vì adapter cục bộ thành công.
- Notification retry giới hạn, attempt quan sát được và lỗi cuối không chứa credential/provider payload.

Quyết định tham chiếu: [ADR-003](../06-architecture/adr/ADR-003-order-inventory-consistency.md), [ADR-004](../06-architecture/adr/ADR-004-payment-state-and-cod.md), [ADR-012](../06-architecture/adr/ADR-012-backend-test-idempotency-notification.md) và [sơ đồ notification BE-04](be-04-notification-event-flow.md).

## Migration, module và DTO

- Model tùy chỉnh đổi thì tạo migration mới bằng `medusa db:generate`; không sửa migration đã chạy.
- Migration và seed chỉ chạy trên PostgreSQL disposable cho verification.
- Module service giữ CRUD/domain behavior; workflow giữ orchestration/compensation.
- Không thêm module hoặc bảng trùng order/payment; dùng Medusa core và extension points có hỗ trợ.
- DTO route tách khỏi input/workflow domain; không truyền `MedusaRequest` xuống module/workflow.
- PR phải ghi migration, seed, dữ liệu đã lưu và khả năng nâng cấp/tương thích hoặc `N/A`.

## Ánh xạ code → test → requirement

| Thay đổi/luồng | Test tối thiểu | Requirement |
|---|---|---|
| Cart/auth legacy hoặc native | Success, invalid quantity, cross-cart deny, auth 401/403 và DTO projection | FR-AUTH, FR-CART |
| Checkout/payment simulator | Success/failure, COD, total server, stock snapshot, không production simulator | FR-CHK, FR-PAY, INV-ORD-001 |
| Duplicate/concurrent checkout | Replay cùng intent, stock contention, reconciliation | FR-CHK, FR-PAY, FR-INV, NFR-REL-01 |
| Notification subscriber/worker | Duplicate/stale event, provider down, retry, failed, no source-state change | FR-NOT, NFR-NOTIFY-01 |
| Staff/Admin mutation | Allow/deny theo ma trận đã duyệt và audit | FR-ADM, PERM-001..005 |

## Compatibility và rollback

- Đầu ra kế thừa giữ contract hiện có khi chưa có quyết định ngừng dùng; thay DTO phải version hóa hoặc migration có chủ đích.
- Rollback ứng dụng không hoàn nguyên dữ liệu/schema; migration mới không được đảo ngược nếu có dữ liệu chưa tương thích.
- Trước rollback, xác nhận model, migration, seed và route consumer đang chạy theo cùng phiên bản.
- Nếu provider hoặc worker không tương thích, quay về cấu hình nonprod/dừng worker theo cơ chế đã phép; không xóa dữ liệu retry/outbox.
- PR ghi known limitation và hành động gỡ; không che blocker bằng ghi chú hoặc feature flag không kiểm chứng.

