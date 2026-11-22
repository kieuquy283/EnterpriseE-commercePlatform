<a id="daymark-documentation"></a>
# Tài liệu DAYMARK

Tài liệu có hai tuyến đọc liên kết với nhau: đặc tả nghiệp vụ độc lập công nghệ và ánh xạ kỹ thuật từ đặc tả sang triển khai DAYMARK.

<a id="primary-business-first-specification"></a>
## Đặc tả lấy nghiệp vụ làm gốc

Các tài liệu này xác định phạm vi nghiệp vụ, tác nhân, quy tắc, yêu cầu, tải và thiết kế logic. Yêu cầu nghiệp vụ được ưu tiên khi có mâu thuẫn với bản mô tả triển khai; phê duyệt và quyết định còn mở thuộc tài liệu nguồn tương ứng.

| Lĩnh vực | Tài liệu |
| --- | --- |
| Dự án | [Điều lệ](00-project/project-charter.md), [phạm vi và giả định](00-project/scope-and-assumptions.md), [sổ nguồn và giả định](00-project/source-and-assumption-register.md) |
| Nghiệp vụ | [BRD](01-business/BRD.md), [bản đồ năng lực](01-business/business-capability-map.md), [quy trình](01-business/business-processes.md), [quy tắc](01-business/business-rules.md) |
| Người dùng | [Các bên liên quan](02-users/stakeholder-analysis.md), [tác nhân và mục tiêu](02-users/actors-and-user-goals.md), [hành trình](02-users/user-journeys.md) |
| Yêu cầu | [SRS](03-requirements/SRS.md), [ca sử dụng và kiểm thử nghiệm thu](03-requirements/use-case-specifications.md), [kịch bản chất lượng](03-requirements/quality-attribute-scenarios.md), [truy vết](03-requirements/requirements-traceability.md) |
| Tải | [Phân tích tải](04-workload/workload-analysis.md) |
| Dữ liệu | [Mô hình miền](05-data/domain-model.md), [từ điển](05-data/data-dictionary.md), [quyền sở hữu và tính nhất quán](05-data/data-ownership-and-consistency.md) |
| Kiến trúc logic | [Thiết kế tổng thể](06-architecture/logical-architecture.md), [hợp đồng giao diện](06-architecture/api-and-interface-contracts.md), [tích hợp](06-architecture/integration-design.md), [ADR logic](06-architecture/adr/ADR-001-application-boundary-style.md) |

<a id="technical-design-and-implementation"></a>
## Thiết kế kỹ thuật và triển khai

Bắt đầu từ [mục lục kỹ thuật](technical/README.md). Hướng dẫn kỹ thuật trình bày lựa chọn công nghệ, ranh giới API/lưu trữ cụ thể, kiểm chứng kỹ thuật, bảo mật, triển khai AWS và khôi phục.

Thành phần logic thể hiện trách nhiệm; không hàm ý dịch vụ độc lập hay thay thế nền tảng công nghệ. Thay đổi đáng kể về công nghệ hoặc triển khai cần quyết định rõ ràng. [Ánh xạ yêu cầu](technical/requirements-mapping.md) nối mã nghiệp vụ với luồng triển khai và ghi nhận quyết định xử lý khác biệt.

<a id="working-guides"></a>
## Hướng dẫn làm việc

- [Thiết lập cục bộ và tạo tài khoản quản trị](setup.md)
- [Quy ước đóng góp và kiểm chứng](../CONTRIBUTING.md), [hướng dẫn cho agent](../AGENTS.md)
- [Nhận diện và nguồn gốc tài sản thương hiệu](brand/README.md), [hệ thống thiết kế storefront](design-system/README.md)
- [Dữ liệu mẫu danh mục và quy trình nhập](catalog/DATASET.md)
- [Quy trình triển khai](../deploy/RUNBOOK.md)
- [Công việc còn lại](spec/07-delivery.md)
- [Công cụ trình bày](../presentation/README.md)

<a id="teacher-coverage"></a>
## Đối chiếu yêu cầu giảng viên

| Nội dung | Tuyến đọc |
| --- | --- |
| P1 — Nghiệp vụ và kiến trúc | Nghiệp vụ, người dùng, yêu cầu, tải và kiến trúc logic ở trên |
| P2 — Ứng dụng, dữ liệu và tích hợp | Dữ liệu/giao diện logic, [kiến trúc kỹ thuật](spec/03-architecture.md) và [ánh xạ API/lưu trữ](spec/04-data-api.md) |
| P3 — Bảo mật và DevOps | [Vận hành](spec/06-operations.md) và quy trình triển khai |
| P4 — Kỹ thuật vận hành thực tế | [Kiểm thử](spec/05-testing.md), vận hành và bằng chứng kiểm chứng có ngày tháng |
| P5 — Kỹ thuật gợi ý | [Yêu cầu đánh giá](spec/05-testing.md) và [tham chiếu chuyên sâu](reference/README.md#product-suggestion-research) |

<a id="document-lifecycle-and-evidence"></a>
## Vòng đời tài liệu và bằng chứng

Đặc tả xác định hành vi bắt buộc; hướng dẫn kỹ thuật giải thích lựa chọn triển khai; hướng dẫn vận hành mô tả quy trình. Tiến độ, số lượng kiểm thử, phiên bản triển khai, tình trạng dịch vụ và kết quả đo thuộc công việc còn lại hoặc báo cáo có ngày tháng, không thuộc README.

Mỗi báo cáo kiểm chứng cần ghi phiên bản, môi trường, ngày, lệnh và kết quả. Mục tiêu không phải số đo; tuyến API đã có không đồng nghĩa luồng nghiệp vụ đã nghiệm thu; triển khai lịch sử không chứng minh dịch vụ hiện đang hoạt động. [Bằng chứng và nghiên cứu](reference/README.md) dẫn đến kết quả và quyết định quyền sử dụng dữ liệu. Nghiên cứu chuyên sâu không thay thế phạm vi nghiệp vụ hoặc cấp quyền công bố dữ liệu.

Giữ kết quả kiểm chứng trong CI hoặc báo cáo nghiệm thu có phiên bản; không thêm nhật ký bàn giao, ghi chú dọn dẹp hoặc báo cáo tiến độ tạm thời vào tài liệu hướng dẫn lâu dài.

### BE-05 — Staff/Admin lifecycle, fulfillment, tracking và COD (2026-11-22)

Các đầu ra được tách riêng theo loại tài liệu. Walkthrough đang **BLOCKED** vì Docker chưa khả dụng trong Ubuntu WSL; quyền Staff khác Admin thuộc BE-08 và chưa được chứng minh:

- [Staff walkthrough và bằng chứng nghiệm thu](report/be-05-staff-walkthrough.md) — BLOCKED; chưa có order ID/audit trail thực.
- [Status contract fulfillment/tracking/COD](technical/be-05-status-contract.md) — Proposed; chưa nghiệm thu runtime.
- [Permission Matrix Staff/Admin](technical/staff-admin-permission-matrix.md) — tài liệu BE-08 riêng, Proposed; không phải bằng chứng quyền đã enforce.

### BE-08 — Staff/Admin RBAC (2026-11-20)

Trạng thái hiện tại: **BLOCKED** — chưa có ma trận quyền được duyệt hoặc license Enterprise được xác minh; HTTP suite tổng quát đã chạy trên DB disposable nhưng chưa có kiểm thử allow/deny theo role đã duyệt hoặc browser walkthrough. Mỗi sản phẩm bàn giao được tách thành một file:

- [Permission Matrix v1](technical/staff-admin-permission-matrix.md) — Draft, chờ chủ chính sách.
- [License / Feasibility Decision](technical/staff-admin-rbac-license-feasibility.md) — entitlement chưa xác minh.
- [ADR-011 — Staff/Admin RBAC](06-architecture/adr/ADR-011-staff-admin-rbac.md) — đề xuất và blocker, chưa được chấp thuận.
- [Role-negative HTTP / Browser Test Report](report/be-08-role-negative-http-browser-test-report.md) — chưa chạy; không tuyên bố PASS.
- [CI Artifact Status](report/be-08-ci-artifact.md) — artifact CI role-test chưa được tạo.
