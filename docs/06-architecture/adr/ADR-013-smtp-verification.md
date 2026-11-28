# ADR-013 — Kiểm chứng SMTP

- Ngày: 28/11/2026.
- Trạng thái: Áp dụng cho kiểm chứng thông báo trong môi trường CI cô lập.
- Yêu cầu: R-OPS02, BE-04, FR-08; CI-01.

## Quyết định

### Thông báo

Giữ outbox hiện hữu; thêm adapter SMTP qua Nodemailer, không tự viết SMTP client. `NOTIFICATION_TRANSPORT=smtp` chọn adapter; sandbox chỉ là test double. Thiếu transport ở production hoặc transport không hợp lệ phải ghi failure, không trả thành công sandbox ngầm. Không gửi email thật trong CI: Mailpit là SMTP server/inbox trên network disposable, không relay ra ngoài.

Khóa `notification:<id>` bằng module Locking Medusa trước khi đọc/claim/send/persist; provider Redis cho nhiều tiến trình. Job xử lý mỗi 10 giây, lấy batch tối đa 100 cho từng nhóm pending/retry/processing và xét lease/backoff. Record processing hết lease được thử lại; lỗi một record không chặn toàn bộ batch. Khóa có thời gian sống 180 giây và kiểm signal mất khóa trước send/persist.

Theo [Nodemailer SMTP transport](https://nodemailer.com/smtp), SMTP production yêu cầu implicit TLS hoặc STARTTLS; không tắt xác minh chứng chỉ. Timeout kết nối/greeting/socket hữu hạn, không log giao thức hay message content, chỉ lưu mã lỗi đã loại PII. Nội dung phân biệt xác nhận đơn với thu COD. Message-ID ổn định theo dedupe key hỗ trợ đối soát, không bảo đảm inbox dedupe.

Ngữ nghĩa là **at-least-once khi worker chết giữa SMTP acceptance và persist**. Lock và closed state ngăn gửi đồng thời/replay đã hoàn tất; không có transaction nguyên tử giữa SMTP và PostgreSQL. `sent` là SMTP chấp nhận, không phải người dùng đã đọc hay delivery receipt từ email provider. Redis giữ event trước khi subscriber tạo outbox; không tuyên bố DB order và outbox cùng transaction, hoặc phục hồi sau mất dữ liệu Redis đã được chứng minh.

## Nghiệm thu

CI tạo đơn qua HTTP loopback trên mạng thử nghiệm riêng. Notification phải đi qua API → Redis → worker → SMTP → Mailpit receipt; có outage/retry, worker restart/expired lease và hai tiến trình tranh cùng record. Chỉ dùng data synthetic, hủy đơn và đối chiếu tồn, cleanup toàn bộ tài nguyên của run.

Kết quả thực thi, skip/fail và giới hạn nằm trong báo cáo có ngày; ADR và tệp test không tự là bằng chứng PASS. Không thay quyền bảo vệ nhánh của owner, không triển khai AWS hoặc tự gửi email bên ngoài trong tác vụ này.
