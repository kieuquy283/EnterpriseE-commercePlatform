# ADR-011 — Staff/Admin RBAC boundary

- **Ngày:** 2026-11-20
- **Trạng thái:** **Proposed / BLOCKED — chưa được chủ chính sách hoặc chủ kiến trúc chấp thuận.**
- **Người quyết định:** Chưa xác định.
- **Yêu cầu:** BE-08; PERM-001..005; FR-AUTH-04; FR-ORD-03; FR-ADM-01/02; OPEN-USR-003/004/011.

## Bối cảnh

SRS và ma trận actor hiện là Draft. Các quyết định về phạm vi đơn/tồn cho Staff, quản lý quyền/xuất dữ liệu cho Admin và báo cáo còn mở. Backend dùng actor `customer` cho Store API và `user` cho Medusa Admin. `apps/backend/medusa-config.ts` không đăng ký RBAC; không có bằng chứng server-side phân biệt Staff với Admin. Medusa Admin UI không phải bằng chứng rằng Admin API bị giới hạn.

Medusa Enterprise RBAC cần license. Chưa xác minh được entitlement. Không có DB disposable khả dụng để kiểm thử migration/bootstrap an toàn.

## Quyết định đề xuất

1. **Không bật hoặc mô phỏng RBAC bằng tên vai trò.** Không đăng ký module RBAC, chạy migration, cấp role hay tuyên bố Staff đã bị giới hạn khi thiếu entitlement và policy được duyệt.
2. **Giữ Staff ở trạng thái BLOCKED.** Không onboarding Staff vào `/app` hoặc Admin API hiện hữu như thể đây là quyền tối thiểu.
3. **Không coi ẩn menu là authorization.** Mọi thao tác phải được kiểm tra server-side trên mọi đường gọi; thao tác/đối tượng/phạm vi chưa được duyệt mặc định không cấp trong thiết kế đích.
4. **Nếu license được xác nhận:** thử module chính thức trên DB disposable đúng phiên bản Medusa, kiểm migration/role bootstrap, kiểm tra và thu hồi quyền Super Admin dư, sau đó cấu hình role/policy theo ma trận đã duyệt.
5. **Nếu không có license:** chỉ sau khi ma trận được duyệt mới thiết kế bề mặt Staff riêng ở server với endpoint/use case giới hạn. Không dùng Admin API toàn quyền và không sao chép API lõi vô cớ. Mọi mutation theo workflow/policy chuẩn của ứng dụng; kiểm tra assignment/scope tại server, trả DTO tối thiểu và audit an toàn.

## Trạng thái quyết định

Đây là phương án an toàn tạm thời cho đến khi có phê duyệt, không phải lựa chọn kiến trúc cuối cùng và không cấp quyền. Các mục OPEN-USR-003/004/011 còn mở. Không có thay đổi code/guard trong ADR này.

## Hệ quả

- BE-08 chưa đạt Done; Customer/Staff/Admin chưa được chứng minh qua ba danh tính kiểm thử.
- HTTP regression tổng quát chạy trên PostgreSQL disposable nhưng chưa có test role matrix 401/403 cho Staff-vs-Admin; chưa có Admin UI walkthrough hoặc CI artifact role-negative.
- Không chạy migration trên DB đang hoạt động hoặc không rõ tính disposable.
- Công việc tiếp theo phải có chủ chính sách, quyết định entitlement và môi trường DB dùng riêng trước khi triển khai.

## Xem xét lại khi

- Chủ chính sách ký duyệt Permission Matrix v1.
- Chủ license xác nhận entitlement RBAC hoặc quyết định chính thức không có license.
- Có PostgreSQL/Redis disposable, kế hoạch bootstrap user và người chịu trách nhiệm kiểm tra Super Admin.

## Tham chiếu

- [Permission Matrix v1](../../technical/staff-admin-permission-matrix.md)
- [License / Feasibility Decision](../../technical/staff-admin-rbac-license-feasibility.md)
- [Role-negative HTTP/browser test report](../../report/be-08-role-negative-http-browser-test-report.md)
