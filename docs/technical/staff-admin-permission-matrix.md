---
document_id: TECH-SEC-RBAC-01
title: Ma trận quyền Staff/Admin
version: 1.0.0
status: Proposed — chờ chủ chính sách duyệt
owner: Backend
reviewer: Chủ chính sách/vận hành và người rà bảo mật — chưa xác nhận
last_updated: 2026-11-18
related_documents:
  - staff-admin-rbac-license-feasibility.md
  - ../02-users/actors-and-user-goals.md
  - ../00-project/source-and-assumption-register.md
  - ../03-requirements/SRS.md
  - ../DAYMARK_Project_Status_Assessment_2026-11-16_v1.1_RBAC.md
---

# Ma trận quyền Staff/Admin

## 1. Mục đích và trạng thái

Tài liệu này đề xuất ma trận quyền tối thiểu cho `Customer`, `Staff` và `Admin`. Đây là đầu ra tài liệu cho BE-08; **không** bật RBAC, thay đổi cấu hình, chạy migration, xác nhận quyền đã hoạt động hay nghiệm thu API/UI. Quyết định license và tính khả thi Medusa Enterprise RBAC được ghi riêng trong [License/Feasibility Decision](staff-admin-rbac-license-feasibility.md).

Ma trận là đề xuất để chủ chính sách và người rà bảo mật duyệt. `OPEN-USR-003`, `OPEN-USR-004`, `OPEN-USR-011`, `OPEN-FUL-001` và các quyết định nghiệp vụ liên quan vẫn mở; vì vậy những quyền phụ thuộc vào chúng chưa được cấp. Khi chưa có phê duyệt và kiểm thử server-side, mục tiêu Staff hạn chế vẫn **BLOCKED**.

## 2. Ký hiệu và nguyên tắc

| Ký hiệu | Ý nghĩa |
|---|---|
| **A** | Đề xuất cho phép trong đúng phạm vi ở cột hành động; không phải bằng chứng code đã enforce. |
| **A\*** | Đề xuất cho phép có điều kiện: xác thực server-side, kiểm quyền trên từng request, phạm vi dữ liệu tối thiểu và audit phù hợp. |
| **D** | Đề xuất từ chối. |
| **H** | Tạm giữ, mặc định chưa cấp cho tới khi chủ chính sách quyết định và yêu cầu được kiểm chứng. Không phải quyền ngầm. |

- Vai trò nghiệp vụ không tự tạo quyền cho tài khoản Medusa. `Customer` dùng Store API; `Staff` và `Admin` hiện cùng là actor `user` của Medusa Admin.
- Quyền phải được kiểm tra tại server/API. Ẩn menu hoặc nút trên `/app` không phải kiểm soát truy cập.
- `Customer` chỉ được đọc/sửa tài nguyên thuộc danh tính đã xác thực của mình. Không dùng `customer_id` do client gửi làm nguồn xác thực/ủy quyền.
- Với mọi tài nguyên, chỉ trả về trường cần thiết. Đặc biệt, thông tin liên hệ/địa chỉ chỉ được hiển thị cho đúng nhu cầu xử lý.
- `H` không có nghĩa là “cho phép tạm thời”. Nếu chưa thể thực thi chính sách đề xuất, không cấp Staff quyền rộng để thay thế.

## 3. Ma trận đề xuất

| Tài nguyên / hành động | Guest | Customer đã xác thực | Staff | Admin | Căn cứ / điều kiện |
|---|:---:|:---:|:---:|:---:|---|
| Xem/tìm danh mục công khai đã publish | A | A | A | A | PERM-001; tuân thủ channel/published và dữ liệu công khai. |
| Đăng ký/đăng nhập Customer | A | A | D | D | PERM-002; Staff/Admin không dùng luồng customer để nhận quyền nội bộ. |
| Đọc/sửa hồ sơ và địa chỉ của chính mình | D | A* | D | D | FR-AUTH-03, PERM-003; chủ thể phải lấy từ phiên/token hợp lệ. |
| Đọc/sửa giỏ của chính mình | H | A* | D | D | Guest cart còn theo OPEN-USR-001/BE-01; Customer chỉ thao tác giỏ thuộc mình. |
| Checkout / tạo đơn | H | A* | D | D | Guest checkout chưa chốt OPEN-USR-001; Customer chỉ tạo đơn từ request hợp lệ của mình. |
| Đọc đơn của chính mình | H | A* | D | D | FR-ORD-01, PERM-003; guest order lookup chưa chốt OPEN-USR-002. |
| Đọc đơn được giao và trường tối thiểu để xử lý | D | D | A* | A* | FR-AUTH-04, FR-ORD-03, PERM-004; phải chứng minh assignment và không lộ đơn ngoài phạm vi. |
| Chuyển trạng thái/fulfillment của đơn được giao | D | D | H | A* | Staff chờ OPEN-USR-003/OPEN-FUL-001; chỉ chuyển trạng thái được duyệt, không nhảy bước. |
| Đọc thông tin giao hàng/liên hệ khách | D | Chỉ dữ liệu mình | A* | A* | PERM-003/004; chỉ trường tối thiểu, chỉ đơn được giao/nhiệm vụ được duyệt. |
| Đọc tồn/chào bán cần thiết | A | A | A* | A* | Customer chỉ dữ liệu công khai/khả dụng; Staff/Admin giới hạn theo nhiệm vụ. |
| Điều chỉnh tồn kho | D | D | H | A* | Staff chưa được mặc định quyền sửa; chờ OPEN-USR-003 và audit nghiệp vụ. |
| Tạo/sửa sản phẩm, giá, khuyến mại hoặc publish | D | D | D | A* | FR-ADM-01; Staff không có quyền này theo mặc định; quyền khuyến mại còn phụ thuộc OPEN-PROMO-001. |
| Hủy/sửa đơn sau khi nhận, xác nhận thu tiền hoặc hoàn tiền | D | D | H | H | Chưa cấp theo vai trò; cần quyết định riêng về fulfillment/payment và bằng chứng giao dịch. |
| Xem báo cáo | D | D | H | H | OPEN-USR-011/OPEN-REPORT-001 phải chốt nhóm dữ liệu và người xem trước khi cấp. |
| Mời/quản lý user hoặc gán/gỡ role/policy | D | D | D | H | PERM-005, OPEN-USR-004; chỉ người được chủ chính sách ủy quyền, không mặc định mọi Admin. |
| Xuất dữ liệu riêng của khách | D | D | D | D | PERM-005/OPEN-USR-004; chưa có mục đích/phạm vi được duyệt. |
| Gọi trực tiếp Admin API | D | D | H | A* | Staff chỉ được gọi endpoint đã được cho phép và bảo vệ tại server; customer không phải admin actor. |

### Diễn giải vai trò

- **Customer:** tài nguyên riêng được xác định từ danh tính xác thực ở server; mọi truy cập chéo Customer A/B bị từ chối, không tiết lộ dữ liệu hay sự tồn tại của tài nguyên B.
- **Staff:** chỉ cần tra cứu và xử lý công việc được giao. Không cấp quyền mời/quản lý user, quản lý policy, xuất dữ liệu, thay giá, hủy/hoàn tiền hoặc chỉnh tồn cho tới khi có quyết định rõ. Những hành động `H` không được triển khai thành quyền rộng trên Admin API.
- **Admin:** được thao tác các năng lực quản trị đã được phê duyệt, không đồng nghĩa là chủ chính sách. Quản lý quyền user, xuất dữ liệu, hủy/hoàn tiền và các hành động chưa có chính sách vẫn `H` hoặc `D`.
- **Guest:** các quyền cart/checkout/tra đơn tiếp tục theo quyết định riêng của BE-01/OPEN-USR-001/002; ma trận này không đổi guest semantics.

## 4. Các xác nhận cần có trước khi gọi ma trận là “được duyệt”

| Câu hỏi cần chốt | Chủ thể cần xác nhận | Liên kết |
|---|---|---|
| Staff được xem đơn nào, được chuyển những trạng thái nào, có được hủy/đổi đơn không? | Chủ vận hành/chủ chính sách | OPEN-USR-003, OPEN-FUL-001 |
| Staff có được sửa tồn không hay chỉ xem/báo thiếu? | Chủ vận hành/chủ chính sách | OPEN-USR-003, OPEN-STOCK-001 |
| Admin nào được mời/quản lý user và gán role? Có được xuất dữ liệu khách không? | Chủ chính sách và người rà bảo mật | OPEN-USR-004, PERM-005 |
| Staff/Admin được xem nhóm báo cáo và trường dữ liệu nào? | Vận hành và quản trị | OPEN-USR-011, OPEN-REPORT-001 |

Cho tới khi các quyết định trên được ghi với ngày, người/vai trò phê duyệt và liên kết bằng chứng, trạng thái tài liệu vẫn là **Proposed**. Không dùng nội dung này để tuyên bố đã có RBAC hoặc Staff đã bị giới hạn.

## 5. Tham chiếu

- [License/Feasibility Decision Medusa RBAC](staff-admin-rbac-license-feasibility.md)
- [Actors, goals và ma trận quyền Draft](../02-users/actors-and-user-goals.md)
- [Sổ nguồn và giả định — OPEN-USR-003/004/011](../00-project/source-and-assumption-register.md)
- [SRS — FR-AUTH-04, FR-ORD-03, FR-ADM-01/02](../03-requirements/SRS.md)
- [Đánh giá trạng thái DAYMARK ngày 16/11/2026](../DAYMARK_Project_Status_Assessment_2026-11-16_v1.1_RBAC.md)

- [Medusa RBAC Module](https://docs.medusajs.com/resources/enterprise/rbac)
- [Medusa RBAC Concepts](https://docs.medusajs.com/resources/enterprise/rbac/concepts)
- [Medusa RBAC Scopes](https://docs.medusajs.com/resources/enterprise/rbac/scopes)
