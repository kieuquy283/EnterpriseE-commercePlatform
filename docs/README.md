# Mục lục tài liệu

Đây là lộ trình tài liệu theo hướng **nghiệp vụ trước, công nghệ sau**. Các bản định nghĩa dự án, phạm vi, SRS và bằng chứng triển khai cũ vẫn ở đường dẫn lịch sử để đối chiếu. Tài liệu mới ở trạng thái **Draft**, chưa phải chính sách nghiệp vụ đã được duyệt.

| Giai đoạn | Tài liệu hiện có | Trạng thái |
|---|---|---|
| 00 Dự án | [Tuyên bố dự án](00-project/project-charter.md), [Phạm vi và giả định](00-project/scope-and-assumptions.md), [Sổ nguồn và giả định](00-project/source-and-assumption-register.md) | Bản nháp |
| 01 Nghiệp vụ | [BRD](01-business/BRD.md), [Bản đồ năng lực](01-business/business-capability-map.md), [Quy trình](01-business/business-processes.md), [Quy tắc](01-business/business-rules.md) | Bản nháp; chờ nhóm rà soát |
| 02 Người dùng | [Các bên liên quan](02-users/stakeholder-analysis.md), [vai trò và mục tiêu](02-users/actors-and-user-goals.md), [hành trình](02-users/user-journeys.md) | Bản nháp; chờ rà Business và quyền/chính sách |
| 03 Yêu cầu | [SRS](03-requirements/SRS.md), [use case và AT](03-requirements/use-case-specifications.md), [tình huống chất lượng](03-requirements/quality-attribute-scenarios.md), [truy vết](03-requirements/requirements-traceability.md) | Bản nháp; mục tiêu chất lượng chưa đo/chưa duyệt |
| 04 Tải công việc | [Phân tích tải](04-workload/workload-analysis.md) | Bản nháp; giả định và mục tiêu thử |
| 05 Dữ liệu | [Mô hình miền](05-data/domain-model.md), [từ điển](05-data/data-dictionary.md), [quyền sở hữu và nhất quán](05-data/data-ownership-and-consistency.md) | Bản nháp logic; chính sách dữ liệu còn mở |
| 06 Kiến trúc | [Thành phần logic](06-architecture/logical-architecture.md), [hợp đồng giao diện](06-architecture/api-and-interface-contracts.md), [tích hợp](06-architecture/integration-design.md), [ADR](06-architecture/adr/ADR-001-application-boundary-style.md) | Bản nháp; 3 ADR đề xuất, chưa phê duyệt |
| 07 Đánh giá công nghệ | So sánh công nghệ và kiến trúc vật lý | Dự kiến |

Đọc [sổ nguồn và giả định](00-project/source-and-assumption-register.md) trước khi coi một nhận định là sự thật đã xác minh. Công nghệ trong bản kiến trúc cũ tại local `docs/architecture/cloud-system-architecture.md` chỉ là ảnh chụp triển khai lịch sử, không phải thiết kế đích đã duyệt. Các file kế hoạch và PDF nguồn chỉ đọc tại local theo `.gitignore`; các file cũ đã được Git theo dõi vẫn còn trong lịch sử. Giai đoạn 07 chưa có phase plan trong bộ kế hoạch, vì vậy quyết định database và triển khai vật lý vẫn đang chờ.
