<a id="daymark-technical-documentation"></a>
# Tài liệu kỹ thuật DAYMARK

Đây là tuyến đọc kỹ thuật cho triển khai DAYMARK. [Đặc tả lấy nghiệp vụ làm gốc](../README.md#primary-business-first-specification) sở hữu yêu cầu và thiết kế logic; lớp kỹ thuật giải thích cách nền tảng hiện có thực hiện chúng, phần đang đề xuất và phần đã kiểm chứng.

<a id="read-by-task"></a>
## Đọc theo nhiệm vụ

| Lĩnh vực | Nguồn được duy trì |
| --- | --- |
| Công nghệ, ranh giới thành phần/mã và quyết định triển khai | [Kiến trúc](../spec/03-architecture.md) |
| Quyền sở hữu Medusa, lưu trữ và hợp đồng API cụ thể | [Ánh xạ dữ liệu và API](../spec/04-data-api.md) |
| Baseline schema Medusa, ERD v3, từ điển và khoảng trống dữ liệu | [DATA-01](database-baseline.md) |
| Regression auth/API boundary của cart, kèm bằng chứng ngày 18/11/2026 | [Báo cáo BE-01](../report/api-boundary-regression-2026-11-18.md) |
| Kế hoạch kiểm thử hiệu năng, độ tin cậy, bảo mật và gợi ý | [Kiểm thử kỹ thuật](../spec/05-testing.md) |
| Bảo mật AWS, phát hành, quay lui, khôi phục, giám sát và chi phí | [Vận hành](../spec/06-operations.md), [hướng dẫn triển khai](../../deploy/RUNBOOK.md) |
| Khoảng trống triển khai và trình tự thực hiện | [Công việc còn lại](../spec/07-delivery.md) |
| BE-05 — hợp đồng trạng thái fulfillment, tracking và COD | [Status contract](be-05-status-contract.md) |
| BE-05 — kết quả walkthrough staff | [Báo cáo walkthrough](../report/be-05-staff-walkthrough.md) |
| BE-05 — evidence record và audit trail | [Evidence record](../report/be-05-evidence-record.md) |
| BE-07 — bằng chứng kiểm thử backend | [Test evidence](../report/be-07-backend-test-evidence.md) |
| BE-07 — API/error/compatibility/rollback | [API và ADR handover](be-07-api-adr-handover.md) |
| BE-07 — quyết định idempotency và notification | [ADR-012](../06-architecture/adr/ADR-012-backend-test-idempotency-notification.md) |
| Ma trận quyền Staff/Admin | [Ma trận quyền](staff-admin-permission-matrix.md) |
| License và tính khả thi Medusa Enterprise RBAC | [License/Feasibility Decision](staff-admin-rbac-license-feasibility.md) |
| Môi trường phát triển | [Thiết lập](../setup.md), [quy ước đóng góp](../../CONTRIBUTING.md) |
| Thành phần giao diện cơ bản và triển khai thiết kế | [Hệ thống thiết kế](../design-system/README.md) |
| Dữ liệu mẫu và hành vi nhập danh mục | [Bộ dữ liệu danh mục](../catalog/DATASET.md) |
| Quyết định framework/cloud có ngày tháng | [ADR AWS](../architecture/adr/0001-aws-cloud-stack.md) |
| Nghiên cứu, lịch sử đánh giá và kết quả có ngày tháng | [Mục lục bằng chứng](../reference/README.md) |

<a id="branding-and-requirement-boundary"></a>
## Ranh giới thương hiệu và yêu cầu

Đặc tả nghiệp vụ nguồn mô tả nhà bán lẻ thời trang giả định tại Việt Nam; không phê duyệt DAYMARK hay nhận diện hình ảnh. DAYMARK là thương hiệu dự án của triển khai này. Người yêu cầu dự án đã phê duyệt nhận diện DAYMARK ngày 15 tháng 11 năm 2026; xem [quyết định thương hiệu](../brand/README.md#approval--15-november-2026). Phê duyệt này khác với đồng thuận toàn nhóm hoặc phê duyệt chính sách nghiệp vụ còn mở. SOMEHOW là nguồn tham khảo công khai, không phải nhà tài trợ hay chủ sở hữu yêu cầu.

<a id="baseline-and-change-boundary"></a>
## Nền tảng và ranh giới thay đổi

Nền tảng kỹ thuật gồm Medusa API/Admin và worker, Next.js storefront, PostgreSQL, Redis và ánh xạ triển khai AWS hiện có. Việc mô tả nền tảng không cấp quyền triển khai, chi tiêu mới hoặc khẳng định năng lực tải. Các thành phần logic trong `06-architecture/` biểu thị trách nhiệm, không yêu cầu microservice hay cơ sở dữ liệu độc lập.

Khi yêu cầu đổi, cập nhật ánh xạ hoặc ghi khoảng trống; không âm thầm giảm yêu cầu nghiệp vụ cho khớp mã hiện có. Yêu cầu độc lập công nghệ cũng không phủ nhận lựa chọn framework/provider hiện tại. Trước khi thay công nghệ, cơ sở dữ liệu hoặc AWS, cần đề xuất lợi ích, chi phí, migration/quay lui và kiểm chứng.

[Ánh xạ yêu cầu và khác biệt còn mở](requirements-mapping.md) nối hai lớp. Hai cách xác định độ sẵn sàng 99,5% vẫn khác mẫu số và cửa sổ quan sát; không quy đổi hoặc coi là đã đạt. Chính sách đánh dấu OPEN vẫn còn mở dù mã đã hỗ trợ một lựa chọn khả dĩ.
