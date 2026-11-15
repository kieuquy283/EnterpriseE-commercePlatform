<a id="daymark-backend"></a>

# Backend DAYMARK

Medusa 2.21.2 sở hữu danh mục, khách hàng, giỏ, giá, tồn kho, đơn/thanh toán và fulfillment. API/Admin và worker dùng ứng dụng này với vai trò chạy riêng; module gợi ý/cá nhân hóa tùy chỉnh có cổng bật riêng.

Đọc [đặc tả](../../docs/README.md), [quy tắc backend](AGENTS.md) và [thiết lập cục bộ](../../docs/setup.md). Logic nghiệp vụ thuộc workflow và chính sách module; route API theo tệp là controller truyền tải. Quản trị mặc định dùng Medusa Admin, không phải hệ thống quản trị tùy chỉnh.

Từ thư mục này: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration:http`. Kiểm thử tích hợp cần cơ sở dữ liệu cô lập. Dùng lockfile npm gốc, không cài trình quản lý gói thứ hai. Không seed/migration cơ sở dữ liệu chưa xác định hoặc dùng chung.
