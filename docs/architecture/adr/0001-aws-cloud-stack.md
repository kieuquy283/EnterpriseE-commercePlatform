> ADR triển khai theo thời điểm. Mẫu thành phần và quyết định DAYMARK hiện hành ở [kiến trúc chính thức](../../spec/03-architecture.md); quyết định bên dưới giữ bối cảnh ban đầu.

<a id="adr-aws-cloud-deployment-for-the-course"></a>
# ADR: Triển khai AWS cho môn học

- Trạng thái: chấp nhận ngày 8 tháng 11 năm 2026; kiểm chứng công khai ngày 9 tháng 11.
- Thay thế vai trò triển khai chính của ADR-05 (một VM và Caddy). Diễn tập EC2 vẫn là bằng chứng lịch sử hợp lệ và phương án dự phòng.
- Phạm vi: triển khai cloud, phân phối ảnh và vận hành. Medusa vẫn là một ứng dụng thương mại mô đun, API và worker là tiến trình riêng.

<a id="decision"></a>
## Quyết định

Dùng AWS CloudFormation tại `ap-southeast-2` cho ba lớp:

| Lớp | Trách nhiệm |
| --- | --- |
| Foundation | VPC/subnet/security group, ECR repository, chứng chỉ ACM và role công bố GitHub giới hạn tùy chọn |
| Dữ liệu | RDS PostgreSQL riêng Single-AZ, Redis trên EC2 riêng, S3 riêng mã hóa/có phiên bản, bí mật, lease, watchdog và cảnh báo |
| Ứng dụng | ALB công khai với ACM HTTPS và định tuyến hostname, dịch vụ Fargate storefront/API/worker riêng, API tối đa hai task, CloudWatch và watchdog ứng dụng |

Ảnh sản phẩm từ S3 riêng qua proxy backend công khai `/product-images/public-images/<key>` bằng ECS task role. Không dùng CloudFront trong triển khai vì kiểm tra quyền dự án AWS từ chối tạo distribution. Ảnh tải mới dùng tiền tố công khai riêng; tài liệu khách riêng phải có ranh giới lưu trữ khác. Không triển khai edge CDN trong cấu hình này.

<a id="rationale-and-limits"></a>
## Lý do và giới hạn

Môn học cần trình diễn cụ thể mạng cloud, dịch vụ dữ liệu quản lý, triển khai tiến trình độc lập, hạ tầng khai báo, định tuyến sức khỏe, cấu hình tăng giảm và kiểm soát vận hành. Đây là nền được chọn dù thiết lập Compose một EC2 đã thử đơn giản và rẻ hơn.

Thiết kế chưa sẵn sàng cao toàn diện: RDS Single-AZ, Redis một máy. Cấu hình tăng API không chứng minh năng lực hoặc hiệu năng tăng giảm đã đo. Truyền Redis không mã hóa TLS trong ranh giới security group giới hạn. Lưu lượng ảnh dùng năng lực API/ALB. Sao lưu, diễn tập khôi phục, việc nghiệp vụ worker, checkout trình duyệt, quay lui phát hành và thử tải cần bằng chứng riêng.

Compute demo có lease hữu hạn với lịch tắt theo nỗ lực tốt nhất. ALB và lưu trữ/bí mật giữ lại vẫn tính phí sau pause. Hibernate chỉ bỏ app stack; không xóa dữ liệu giữ lại như dọn dẹp thường lệ.

<a id="evidence-and-chronology"></a>
## Bằng chứng và trình tự thời gian

[Báo cáo EC2 ngày 6 tháng 11](../../report/aws-ec2-deployment-2026-11-06.md) ghi 12 kiểm tra smoke, chín kiểm tra ngoài và một đơn COD qua API trên đường một VM trước đó. Không là bằng chứng checkout Fargate.

[Báo cáo AWS ngày 8–9 tháng 11](../../report/aws-fargate-deployment-2026-11-08.md) ghi nhập tài nguyên giữ lại không thay thế, ba dịch vụ ECS, target ALB khỏe và 14 kiểm tra công khai gồm proxy S3 riêng. Triển khai dùng Docker build cục bộ và AWS CLI. Công bố GitHub và workflow SSH dự phòng được cấu hình nhưng báo cáo đó chưa thực thi.

<a id="operational-references"></a>
## Tham chiếu vận hành

- [Hướng dẫn vận hành chính thức](../../../deploy/RUNBOOK.md)
- [Hướng dẫn CloudFormation chi tiết](../../../deploy/cloudformation/README.md)
- [Kiến trúc hệ thống](../../spec/03-architecture.md)
- [Hướng dẫn EC2 dự phòng](../../../deploy/ec2/RUNBOOK.md)
