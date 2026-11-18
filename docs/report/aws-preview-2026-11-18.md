# Kiểm chứng preview AWS — 18/11/2026

## Phạm vi và artifact

Preview có thời hạn trên stack hiện có `commerce-*`, Region `ap-southeast-2`. Không thay thế/xóa RDS, Redis, bucket, ECR hay các bí mật ứng dụng. Compute lease kết thúc **20:48 UTC ngày 18/11, tức 03:48 Việt Nam ngày 19/11/2026**; watchdog dừng compute, không xóa ALB/lưu trữ giữ lại.

Mã ứng dụng nằm trong commit `bae01ce` cùng các commit trước trên nhánh `feat/daymark-preview-operations`. Image được build trước khi ghi commit; đối chiếu bảy tệp runtime xác nhận nội dung khớp. Digest bất biến và kết quả nằm ở [release.json](evidence/aws-preview-2026-11-18/release.json).

## Kết quả

| Kiểm tra | Kết quả và giới hạn |
| --- | --- |
| Local backend | 144 unit tests, 30 HTTP tests trên dịch vụ disposable; lint/types/build đạt |
| Local storefront production | 3/3 regression trước đó; toàn bộ suite 18 PASS, 6 SKIP, 0 FAIL. Skip chỉ do thiếu fixture H&M; xem [bằng chứng browser](preview-browser-2026-11-18.md) |
| IaC | 27 unit tests đạt sau khi bổ sung PyYAML vào venv thử riêng; lần đầu thiếu dependency, không phải lỗi IaC |
| AWS release | RDS/Redis khởi động từ tài nguyên giữ lại; RDS recovery point mới được xác nhận trước ghi. Migration thành công. API/Admin, worker và storefront đều desired/running 1, service stable |
| Catalog/media | Nhập 30 sản phẩm DAYMARK, 230 SKU/tồn ban đầu, 3 collections, 6 categories, 30 ảnh; giữ ba sản phẩm legacy. Fresh-state rerun check: không thêm/sửa product hoặc tồn. Ảnh là minh họa preview, không phải ảnh SKU chính xác |
| HTTPS/API | Region Vietnam/VND, giá VND, SKU duy nhất và ảnh có thumbnail đạt. Proxy trả raster + nosniff; unsigned S3 bị từ chối; prefix riêng và ảnh thiếu bị từ chối. [JSON](evidence/aws-preview-2026-11-18/api-verification.json) |
| Storefront | Home, catalog và PDP HTTPS 200 với nội dung dự kiến; browser mở trang DAYMARK và hiển thị sản phẩm/giá VND. [JSON](evidence/aws-preview-2026-11-18/storefront-verification.json) |
| Admin | Bootstrap qua Secrets Manager injection, không password/invite trong argv/log; API login và user identity đạt, truy cập không xác thực 401. HTML/JS Admin HTTPS đạt. Xóa secret/policy tạm và deregister hai task definitions một lần; giữ tài khoản, bàn giao credentials riêng |
| COD trên AWS | Tạo đơn, retry tuần tự cùng cart trả cùng order, đọc đơn trong Admin, available stock giảm 1; hủy đơn thử và tồn phục hồi. [JSON](evidence/aws-preview-2026-11-18/checkout-verification.json) |

Hai lượt smoke tạo hai đơn synthetic và đều hủy. Lượt đầu runner đọc field Admin không có trong projection mặc định; đã đối soát đơn hủy, sửa query lấy field rõ và chạy lại toàn bộ PASS. Không xóa lịch sử đơn thử, không dùng dữ liệu khách thật và không gửi email.

Dry-run catalog đầu tiên từ chối hash vì thiếu asset directory trong artifact, trước truy cập catalog. Đặt rõ `DAYMARK_CATALOG_ASSET_DIR=/app/apps/backend/assets/daymark-catalog`, dry-run không conflict rồi apply thành công; không đổi NODE_ENV để vượt guard. Không seed/admin từ startup.

## Giới hạn nghiệm thu

- Dependency audit với npm ghim: 45 high, 64 moderate, 0 critical; preview không giải quyết cổng security phát hành. Xem [triage](../technical/dependency-security.md).
- Retry cloud ở trên là tuần tự, không chứng minh concurrency, lost response hoặc last-unit contention.
- Chưa nghiệm thu Staff RBAC, Admin browser walkthrough, notification delivery/retry, load/k6, alert receipt, rollback hay restore/RPO/RTO.
- Worker service stable không chứng minh đã xử lý notification. COD order acceptance không phải chứng cứ thu tiền.
- CI workflow mới cần lần chạy GitHub riêng; local pass và tài nguyên cloud không thay kết quả CI trên SHA của PR.
- Snapshot/install/browser artifacts chứa dữ liệu synthetic ở máy cục bộ là private; credentials, bearer tokens, URL DB và PII không nằm trong evidence công khai.
