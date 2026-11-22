# BE-04 — Sơ đồ luồng sự kiện thông báo

## Luồng nghiệp vụ

```mermaid
flowchart TD
  A[Workflow nhận đơn] --> B[Sự kiện Medusa order.placed]
  B --> C[Subscriber thông báo khách hàng]
  C --> D{Trạng thái đơn và phiên bản sự kiện hợp lệ?}
  D -->|Không| E[Bỏ sự kiện trùng hoặc sai thứ tự]
  D -->|Có| F[Workflow đưa thông báo vào hàng đợi]
  F --> G[(Bản ghi outbox thông báo)]
  G -->|Khóa dedupe duy nhất| H[Scheduled job xử lý thông báo]
  H --> I[Claim bằng lease xử lý]
  I --> J[Provider sandbox gửi thông báo]
  J -->|Thành công| K[Sent + tham chiếu provider]
  J -->|Thất bại| L[Nhật ký attempt]
  L --> M{Attempt 1-3?}
  M -->|Có| N[retry_wait: 1, 5 hoặc 15 phút]
  N --> H
  M -->|Không| O[Failed + mã lỗi cuối]
  K --> P[Đơn và fulfillment không thay đổi]
  O --> P
```

## Quy tắc idempotency và sự kiện sai thứ tự

- Dedupe key: `orderId:notificationType:channel:templateVersion:stateVersion`.
- Sự kiện lặp lại tái sử dụng bản ghi outbox hiện có.
- `order.placed` bị bỏ khi đơn đã ở trạng thái hủy.
- `order.canceled` bị bỏ trừ khi trạng thái hoặc thời điểm hủy đơn chứng minh đơn đã hủy.
- Các mốc hợp lệ khác nhau của cùng đơn được phép tạo bản ghi khác nhau.
- Provider sandbox dùng dedupe key làm khóa idempotency phía provider.

## Chính sách thử lại

Job xử lý tối đa bốn attempt: lần đầu ngay lập tức, sau đó 1 phút, 5 phút và 15 phút sau lần lỗi trước. Thất bại cuối được lưu với `attempt_count = 4` và `last_error_code`.
