---
document_id: TECH-SEC-RBAC-02
title: License/Feasibility Decision — Medusa Enterprise RBAC
version: 1.0.0
status: Feasibility assessed — entitlement unverified
owner: Backend
reviewer: Người phụ trách hợp đồng/tài khoản Medusa và người rà bảo mật — chưa xác nhận
last_updated: 2026-11-18
related_documents:
  - staff-admin-permission-matrix.md
  - ../DAYMARK_Project_Status_Assessment_2026-11-16_v1.1_RBAC.md
  - ../../apps/backend/package.json
  - ../../apps/backend/medusa-config.ts
---

# License/Feasibility Decision — Medusa Enterprise RBAC

## 1. Kết luận

**Tương thích kỹ thuật: có điều kiện. Quyền sử dụng Enterprise RBAC: chưa xác minh. Quyết định hiện tại: NO-GO bật module.**

Không có bằng chứng trong repo xác nhận entitlement bao gồm feature `rbac`. Đây **không** phải kết luận rằng dự án chắc chắn không có license. Cho tới khi người phụ trách xác nhận entitlement hợp lệ cho môi trường mục tiêu, không đăng ký module hay dựa vào Enterprise RBAC trong kế hoạch triển khai. Không ghi hoặc commit license key.

Ma trận nghiệp vụ được đề xuất và chờ duyệt nằm riêng trong [Ma trận quyền Staff/Admin](staff-admin-permission-matrix.md).

## 2. Bằng chứng và giới hạn

1. [`apps/backend/package.json`](../../apps/backend/package.json) ghim Medusa framework/CLI/core ở `2.21.2`. Tài liệu RBAC của Medusa yêu cầu tối thiểu `v2.21.0`, nên version khai báo đáp ứng mức tối thiểu; điều này không xác nhận runtime/deployment đang chạy đúng version.
2. Tài liệu chính thức Medusa xác nhận RBAC là tính năng Enterprise, cần license có feature `rbac`. Thiếu key hoặc thiếu feature có thể làm ứng dụng thoát khi khởi động.
3. Repo không có bằng chứng entitlement/license được cấp hoặc xác nhận. Không kiểm tra `.env`, secret store, tài khoản Medusa hay AWS runtime trong quyết định này.
4. [`apps/backend/medusa-config.ts`](../../apps/backend/medusa-config.ts) hiện chưa đăng ký `@medusajs/medusa/rbac`. Không có thay đổi cấu hình hay migration nào được thực hiện.
5. RBAC policy cho phép theo cặp resource/operation; role gộp policies. Tài liệu Medusa nêu các Admin user hiện hữu được gán Super Admin khi chạy migration khởi tạo RBAC; user tạo bằng CLI cũng nhận Super Admin mặc định. Trước khi bật, cần kiểm kê role assignments và thu hồi quyền dư cho Staff.
6. **Giới hạn với “đơn được giao”:** RBAC scope có thể giới hạn assignment theo scope, nhưng các Admin routes có sẵn của Medusa không tự đặt scope. Vì vậy không thể coi `order:read`/`order:update` trên Admin API mặc định là giới hạn theo đơn được giao. Policy đó cần enforcement server-side được thiết kế và kiểm chứng; nếu chưa có, Staff không được dùng các endpoint rộng tương ứng.

## 3. Hướng xử lý theo kết quả xác minh

| Kết quả | Quyết định |
|---|---|
| Có xác nhận entitlement cho `rbac` | Chỉ xem xét thay đổi triển khai riêng sau khi ma trận quyền được duyệt, license được cấu hình an toàn, tài khoản/Super Admin được rà soát, migration được thử trên DB disposable và API ALLOW/DENY được chứng minh. Không suy ra Staff chỉ thấy đơn được giao từ RBAC role đơn thuần. |
| Không có entitlement, hoặc chưa xác minh được | Không đăng ký module. Chặn Staff khỏi Admin API/full `/app` nếu không thể bảo vệ đường vào ở server. Chỉ xem xét Staff surface/endpoint giới hạn sau khi policy và server-side authorization được duyệt; nếu không, ghi Staff là **BLOCKED**. |

## 4. Xác nhận còn thiếu

| Câu hỏi | Chủ thể cần xác nhận | Bằng chứng cần lưu |
|---|---|---|
| Dự án có entitlement Medusa Enterprise bao gồm `rbac` cho môi trường mục tiêu không? | Người phụ trách hợp đồng/tài khoản Medusa | Xác nhận entitlement và phạm vi môi trường; không đưa key vào repo |
| Nếu có entitlement, danh sách tài khoản nào có thể là Super Admin sau bootstrap? | Người quản trị hệ thống | Kết quả rà soát role assignment trong môi trường disposable/được phê duyệt |
| Có enforcement server-side nào giới hạn Staff vào đơn được giao khi gọi trực tiếp API không? | Backend và người rà bảo mật | Thiết kế được duyệt và test API âm/dương; không chỉ ảnh chụp UI |

Cho tới khi có bằng chứng, trạng thái entitlement vẫn **unverified** và module vẫn **NO-GO**.

## 5. Tham chiếu

- [Ma trận quyền Staff/Admin](staff-admin-permission-matrix.md)
- [Medusa RBAC Module](https://docs.medusajs.com/resources/enterprise/rbac)
- [Medusa RBAC Concepts](https://docs.medusajs.com/resources/enterprise/rbac/concepts)
- [Medusa RBAC Scopes](https://docs.medusajs.com/resources/enterprise/rbac/scopes)

## 6. Ranh giới không dùng license

Chính sách NO-GO ở trên được triển khai bằng marker `User.metadata.daymark_admin_access = "blocked_staff"` và kiểm tra User service Medusa trên từng request `/admin*` đã xác thực bằng user. Marker tồn tại với giá trị không nhận diện cũng bị từ chối. Không tin role trong JWT, header hay metadata do đăng ký gửi lên; JWT/phiên cũ không bỏ qua việc đọc lại trạng thái user. Customer và user chưa liên kết vẫn chịu middleware xác thực chuẩn của Medusa.

`createBlockedStaffWorkflow` là điểm gọi backend tin cậy, không có route công khai. Workflow chỉ tạo user mới đã bị chặn, kiểm tra auth identity chưa liên kết và khớp email trước khi gắn identity bằng bước chuẩn Medusa. Nó không chuyển Admin hiện hữu thành Staff hoặc đặt lại thông tin đăng nhập. Không dùng invite Admin thông thường để cấp Staff: invite đó tạo user Admin không có marker. Bootstrap Admin không đổi.

Đây là ranh giới chặn toàn bộ Admin API cho Staff được provision đúng workflow, không phải RBAC phân quyền chi tiết. Trang `/app` là shell công khai của Medusa; tải được tài sản tĩnh không cấp quyền API. Không công bố restricted Staff surface hoặc nghiệm thu lifecycle Staff. Admin không có marker và secret API key vẫn giữ semantics chuẩn; cần kiểm kê tài khoản/các khóa đã cấp trước khi phân loại Staff, không coi marker là cơ chế thu hồi khóa bí mật đã bị sao chép. Admin còn có quyền sửa metadata user qua API chuẩn; chỉ người quản trị tin cậy được giữ quyền Admin rộng. Không suy ra các ô H/D trong ma trận đã được enforce cho Admin.

TODO(impl): Hoàn thiện provisioning/revocation Staff với kiểm kê user/identity/secret key và surface giới hạn theo assignment — ranh giới chặn chưa triển khai luồng công việc nhân viên; BE-08, PERM-004/005.
