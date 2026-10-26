# Bằng chứng khảo sát schema live ngày 24/10/2026

Đọc catalog PostgreSQL của database local `commerce`, schema `public`, lúc **17:01:13 Asia/Saigon**. Không đọc dữ liệu giao dịch hoặc payload thanh toán; không chạy seed/migration/checkout.

| File | Nội dung |
| --- | --- |
| [catalog.json](catalog.json) | Metadata live của 24 bảng: 318 cột, 46 constraints, 108 index và enum values |
| [dump-comparison.json](dump-comparison.json) | Đối chiếu tên cột/kiểu cơ sở/nullability, constraints và index với dump 17/10; gồm hash dump và giới hạn so sánh |
| [source-versions.json](source-versions.json) | Phiên bản 10 package Medusa đọc trực tiếp từ `node_modules` |

Nguồn truy vấn: [medusa-erd-v2-schema-readonly.sql](../../medusa-erd-v2-schema-readonly.sql). Truy vấn tự mở transaction `REPEATABLE READ READ ONLY`; lần chạy còn đặt `default_transaction_read_only=on` và `statement_timeout=15000` ở kết nối.

Lệnh PowerShell tương đương để đọc lại kết quả JSON trên đúng container local:

```powershell
Get-Content -Raw docs/erd/medusa-erd-v2-schema-readonly.sql |
  docker exec -i --env 'PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=15000' enterprisee-commerceplatform-postgres-1 psql -X -qAt -U commerce -d commerce -v ON_ERROR_STOP=1 -f -
```

Lệnh trên in metadata ra terminal, không tự ghi đè bộ bằng chứng này. Nếu container/database đổi tên thì chọn lại đúng môi trường trước khi chạy. Không đưa connection string hoặc secret vào tài liệu.

So sánh snapshot chỉ trích `CREATE TABLE`, `ADD CONSTRAINT` và `CREATE INDEX` của 24 bảng từ dump. Các constraint CHECK khác cách in dấu ngoặc đã được kiểm tra là tương đương; cột DEFAULT, độ dài/precision đầy đủ và dữ liệu ứng dụng nằm ngoài phép so sánh. Đối chiếu source model là khảo sát chọn lọc các trường và quan hệ được ghi trong [báo cáo](../../medusa-erd-v2-schema-survey.md), không phải migration audit tự động toàn bộ Medusa.
