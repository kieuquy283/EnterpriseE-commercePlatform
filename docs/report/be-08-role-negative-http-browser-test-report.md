# BE-08 — Role-negative HTTP / Browser Test Report

- **Ngày:** 2026-11-20
- **Verdict:** **BLOCKED — no role authorization result claimed.**
- **Revision inspected:** `bd701245bcb97095ff75ac53a7681ab3920c457c` (`backend/w1`).
- **Test runtime:** Node `v24.22.0`, npm `11.19.1`; repository expects Node `24.22.1`, npm `11.12.1`.
- **Test database:** Disposable PostgreSQL `16-alpine` in Docker Desktop `29.9.2`, loopback-only port `55439`, no persistent volume. Container `daymark-be08-rbac-pg-20261120` was removed after testing.

## Kết quả kiểm tra hiện trạng

| Hạng mục | Kết quả |
|---|---|
| `apps/backend/medusa-config.ts` | Không có cấu hình RBAC module |
| `apps/backend/src/api/middlewares.ts` | Có guard `authenticate("customer", ["bearer", "session"])` cho một số Store routes; không có Staff/Admin role guard |
| Admin API authorization theo Staff/Admin | Chưa chứng minh; không có guard/matrix cho Staff và Admin trong các tệp đã kiểm tra |
| Tài khoản kiểm thử Customer / Staff / Admin riêng | HTTP suite tạo Customer và invited Medusa `user` (test gọi là Staff); không có role Admin tách biệt hoặc role policy |
| Existing HTTP auth allow/deny | **PASS** trong regression tổng quát, xem kết quả bên dưới; không phải role matrix RBAC |
| Gọi trực tiếp Admin API bị cấm bằng Staff | **Chưa chạy**; không thể xác định Staff/test actor hoặc thao tác cấm |
| `/app` browser walkthrough | **Chưa chạy**; không có môi trường và tài khoản role fixture |
| Core DB migrations trong HTTP test runner | Chạy trong các DB integration-test riêng được tạo từ disposable PostgreSQL; **không** chạy migration RBAC |
| Log/trace role-specific | Không có request test RBAC để lưu; không lưu PII/credential |

## Kiểm thử HTTP đã chạy

| Lệnh | Kết quả |
|---|---|
| `npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/auth-catalog-search.spec.ts` | PASS — 1 suite, 24 tests |
| `npm run test:integration:http --workspace=@dtc/backend` | PASS — 5 suites, 31 tests, 137.078 giây |

Suite auth hiện có kiểm tra login Customer/đọc hồ sơ của mình thành công; request không xác thực hoặc token sai/hết hạn bị 401; user nhận Staff invite đăng nhập được và gọi `/admin/users/me` trả 200; token `user` đó bị từ chối 401 ở `/store/customers/me`. Các kiểm tra này chứng minh một phần phân tách actor `customer` và `user` hiện có, **không** chứng minh Staff bị giới hạn so với Admin trên Admin API. Test runner còn tắt Admin UI trong integration run; không có browser test.

Lượt chạy ban đầu dùng `DB_HOST=127.0.0.1` bị timeout khi test runner bật SSL cho host không chứa `localhost`, còn PostgreSQL disposable không bật SSL. Sau khi xác nhận `localhost` vẫn kết nối loopback `127.0.0.1`, lượt targeted và toàn bộ HTTP suite đều PASS. Đây là lỗi cấu hình lần chạy đầu, không phải kết quả PASS.

Docker Desktop được khởi chạy theo phiên người dùng; WSL Ubuntu vẫn ở trạng thái stopped. Container Redis `enterprise-ecommerceplatform-redis-1` đang chạy trước đó được giữ nguyên và không dùng cho suite; chỉ container PostgreSQL dùng riêng được dừng/xóa. Không có dữ liệu ngoài container disposable bị thay đổi.

## Allow / deny cases cần chạy sau khi gỡ blocker

| Caller | Request | Kỳ vọng sau khi policy được duyệt | Kết quả |
|---|---|---|---|
| Không xác thực | Protected Customer, Staff hoặc Admin API | 401 | Chưa chạy |
| Customer A | Đọc tài nguyên Customer A được phép | Allow theo contract cụ thể | Chưa chạy |
| Customer A | Đọc/sửa đơn hoặc hồ sơ của Customer B | Deny; 403 hoặc 404 theo contract không tiết lộ | Chưa chạy |
| Staff | Đọc và xử lý đơn được giao đúng trạng thái | Allow chỉ với thao tác/scope đã duyệt | Chưa chạy |
| Staff | Đọc/sửa đơn không được giao hoặc nhảy trạng thái | Deny; không đổi state | Chưa chạy |
| Staff | Điều chỉnh tồn trong phạm vi chưa được cấp | Deny; không đổi tồn | Chưa chạy |
| Staff | Gọi trực tiếp API mời/quản lý user, sửa role/policy hoặc export ngoài phạm vi | Deny tại server, không chỉ ẩn menu | Chưa chạy |
| Admin | Thực hiện từng hành động được duyệt | Allow đúng policy, có audit | Chưa chạy |
| Admin | Thao tác chưa được duyệt hoặc export ngoài phạm vi | Deny theo policy đã chốt | Chưa chạy |

Các kỳ vọng trên là test plan, không phải kết quả runtime. Ma trận hiện chưa được duyệt và không xác định đầy đủ các response code/field nên chưa thể viết test acceptance có thẩm quyền.

## Lệnh/thao tác và kết quả

- Đọc cấu hình backend, middleware và đặc tả; xác nhận không thấy RBAC registration/Staff-Admin guard trong các tệp đã đối chiếu.
- Kiểm tra tên biến môi trường `MEDUSA_LICENSE_KEY` mà không đọc/ghi giá trị: không có trong process environment hoặc các tệp `.env*` được kiểm tra.
- Docker Desktop `29.9.2` — engine khởi chạy được; WSL Ubuntu không được bật.
- Disposable DB: `postgres:16-alpine`, container `daymark-be08-rbac-pg-20261120`, loopback `127.0.0.1:55439`, không gắn volume; container đã được xóa sau test.
- `npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/auth-catalog-search.spec.ts` — PASS, 24/24.
- `npm run test:integration:http --workspace=@dtc/backend` — PASS, 5/5 suites, 31/31.
- Không chạy migration RBAC, test phân quyền Staff-vs-Admin hoặc browser test vì chưa có policy được duyệt và module RBAC chưa bật. Kết quả HTTP tổng quát không gỡ blocker BE-08.

## Điều kiện mở lại

1. Duyệt [Permission Matrix v1](../technical/staff-admin-permission-matrix.md), đóng OPEN-USR-003/004/011 và xác định response contract.
2. Xác minh license theo [License / Feasibility Decision](../technical/staff-admin-rbac-license-feasibility.md) hoặc duyệt kiến trúc Staff giới hạn không license; ghi ADR quyết định đã chấp thuận.
3. Chuẩn bị DB/Redis disposable và ba tài khoản độc lập không dùng dữ liệu khách thật.
4. Thêm test HTTP dương/âm ở server và kiểm tra state không đổi khi deny; chạy Staff trực tiếp vào API bị cấm.
5. Kiểm tra `/app` bằng browser; xác nhận giao diện và server policy nhất quán, lưu screenshot/log đã giảm PII.
6. Ghi commit SHA, phiên bản Medusa, lệnh chính xác và artifact CI liên kết; không đánh PASS nếu một cổng bắt buộc chưa chạy.

## Tham chiếu

- [Permission Matrix v1](../technical/staff-admin-permission-matrix.md)
- [License / Feasibility Decision](../technical/staff-admin-rbac-license-feasibility.md)
- [ADR-011 — Staff/Admin RBAC](../06-architecture/adr/ADR-011-staff-admin-rbac.md)
