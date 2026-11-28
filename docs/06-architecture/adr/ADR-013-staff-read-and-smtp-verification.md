# ADR-013 — Staff tra cứu được giao và kiểm chứng SMTP

- Ngày: 28/11/2026.
- Trạng thái: Chấp thuận cho phạm vi tra cứu tối thiểu theo yêu cầu hoàn thành E2E của người phụ trách dự án. Không phê duyệt mọi quyền còn mở trong ADR-011.
- Yêu cầu: R-OPS02, BE-08, FR-AUTH-04, PERM-004; BE-04, FR-08; CI-01.

## Quyết định

### Staff

Giữ marker `User.metadata.daymark_admin_access=blocked_staff` để tương thích tài khoản đã tạo và tiếp tục chặn toàn bộ `/admin*`. Thêm `/staff/me`, `/staff/orders/:id` chỉ xác thực actor user bằng bearer/session, kiểm lại User lưu trong DB trên mỗi request. Tên marker nghĩa là bị chặn Admin API, không chặn surface tra cứu riêng.

Assignment tối thiểu nằm trong `User.metadata.daymark_assigned_order_ids`, tối đa 100 ID hợp lệ. Chỉ Admin được phép cập nhật qua User API chuẩn hoặc workflow tin cậy. Không tin metadata của cart/order: Store API cho khách ghi cart metadata và dữ liệu đó có thể đi vào order. Không đọc User metadata của Customer hoặc tin header role/id phía client. Đơn ngoài assignment và đơn không tồn tại trả cùng lỗi 404; role bị thu hồi trả 403, kể cả token/session đã cấp.

DTO chỉ gồm ID, display ID, trạng thái và ID/tên/số lượng item; không xuất email, địa chỉ, payment data hoặc metadata. Next.js `/vn/staff` dùng SDK trong `src/lib/data`, cookie Staff riêng HTTP-only/Secure/SameSite Lax và `no-store`; không dùng token của Customer. Surface chỉ đọc: không cấp fulfillment, tracking mutation, điều chỉnh kho, thu COD, hoàn tiền, export hay quản lý user cho Staff. Các quyền H trong ma trận vẫn giữ nguyên.

Trade-off: dùng metadata do User module sở hữu giúp tránh module/migration/role framework mới cho một flow nhỏ. Đây không phải assignment engine: không có lịch sử phân công hoặc ràng buộc duy nhất toàn cục giữa nhiều Staff. Nếu cần backlog lớn, audit assignment chuyên biệt hoặc mutation fulfillment, phải thiết kế module/link/workflow và quyền tương ứng trước; không mở rộng Admin API.

### Thông báo

Giữ outbox hiện hữu; thêm adapter SMTP qua Nodemailer, không tự viết SMTP client. `NOTIFICATION_TRANSPORT=smtp` chọn adapter; sandbox chỉ là test double. Thiếu transport ở production hoặc transport không hợp lệ phải ghi failure, không trả thành công sandbox ngầm. Không gửi email thật trong CI: Mailpit là SMTP server/inbox trên network disposable, không relay ra ngoài.

Khóa `notification:<id>` bằng module Locking Medusa trước khi đọc/claim/send/persist; provider Redis cho nhiều tiến trình. Job xử lý mỗi 10 giây, lấy batch tối đa 100 cho từng nhóm pending/retry/processing và xét lease/backoff. Record processing hết lease được thử lại; lỗi một record không chặn toàn bộ batch. Khóa có thời gian sống 180 giây và kiểm signal mất khóa trước send/persist.

Theo [Nodemailer SMTP transport](https://nodemailer.com/smtp), SMTP production yêu cầu implicit TLS hoặc STARTTLS; không tắt xác minh chứng chỉ. Timeout kết nối/greeting/socket hữu hạn, không log giao thức hay message content, chỉ lưu mã lỗi đã loại PII. Nội dung phân biệt xác nhận đơn với thu COD. Message-ID ổn định theo dedupe key hỗ trợ đối soát, không bảo đảm inbox dedupe.

Ngữ nghĩa là **at-least-once khi worker chết giữa SMTP acceptance và persist**. Lock và closed state ngăn gửi đồng thời/replay đã hoàn tất; không có transaction nguyên tử giữa SMTP và PostgreSQL. `sent` là SMTP chấp nhận, không phải người dùng đã đọc hay delivery receipt từ email provider. Redis giữ event trước khi subscriber tạo outbox; không tuyên bố DB order và outbox cùng transaction, hoặc phục hồi sau mất dữ liệu Redis đã được chứng minh.

## Nghiệm thu

CI tạo Customer order qua HTTP loopback trên mạng test riêng (không phải nghiệm thu TLS cloud), Admin phân công, Staff browser đọc/tra cứu lại sau đổi assignment/revoke. Chạy native API negatives và kiểm DTO. Notification phải đi qua API → Redis → worker → SMTP → Mailpit receipt; có outage/retry, worker restart/expired lease và hai tiến trình tranh cùng record. Chỉ dùng data synthetic, hủy đơn và đối chiếu tồn, cleanup toàn bộ tài nguyên của run.

Kết quả thực thi, skip/fail và giới hạn nằm trong báo cáo có ngày; ADR và tệp test không tự là bằng chứng PASS. Không thay quyền bảo vệ nhánh của owner, không triển khai AWS hoặc tự gửi email bên ngoài trong tác vụ này.
