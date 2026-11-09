# Báo cáo triển khai AWS EC2 bằng Docker Compose — 06/11/2026

## Kết quả

Đã triển khai hệ thống trên một EC2 tại Sydney và hoàn thành smoke test qua HTTPS. Backend, Storefront, PostgreSQL và Redis hoạt động; Medusa worker chạy riêng. Đã tạo thành công một đơn COD mẫu qua API. Đây là phiên thử có giới hạn thời gian, chưa chứng minh khả năng chịu tải hoặc tính sẵn sàng dài hạn.

- Storefront: https://135791112.xyz/vn/store
- API health: https://api.135791112.xyz/health
- EC2: `i-011c2a03120ae1614`, `m7i-flex.large` — 2 vCPU, 8 GiB RAM.
- Region/profile: `ap-southeast-2` / `aws-project`.
- Public IPv4: `13.54.50.248`.
- CloudFormation: `commerce-ec2-demo`, `CREATE_COMPLETE`.
- EBS: 30 GiB gp3 mã hóa; volume `vol-04aa8d0e623026911`.
- Mã nguồn: `main` tại `f4845ba` cộng các thay đổi triển khai local. Không commit/push trong phiên này. SHA-256 gói nguồn nằm trong [bằng chứng lệnh smoke](evidence/ec2-2026-11-06/smoke-command.json).

## Cấu hình đã áp dụng

Caddy nhận truy cập trên cổng 80/443, tự cấp chứng chỉ và chuyển HTTP sang HTTPS. Hai DNS record A trỏ về EC2 ở chế độ DNS only. Backend/Storefront/PostgreSQL/Redis chỉ publish cổng 9000/8000/5432/6379 vào loopback. Security group chỉ mở inbound TCP 80/443; quản trị bằng SSM, không mở SSH.

API và worker dùng chung image Medusa 2.21.2, với worker mode riêng. Storefront dùng Next.js 15.5.24. PostgreSQL 16 và Redis 7 chạy trong Docker volumes trên EBS; Redis bật AOF. Đây là dữ liệu demo mới trên EC2, tách biệt RDS đã giữ lại từ bài thử Fargate.

Secrets PostgreSQL/JWT/cookie được sinh trên EC2; không đưa vào gói nguồn hoặc báo cáo. `.env` có quyền 0600. Production Compose từ chối secrets rỗng, dùng CORS HTTPS và tự khởi động lại các dịch vụ dài hạn. Publishable key được lấy sau seed rồi dùng để build Storefront. Storefront có healthcheck; Caddy đợi cả hai ứng dụng healthy.

Đã chạy migrations, seed, build backend/admin và storefront thành công trên EC2. Gói nguồn trung chuyển trong S3 private có mã hóa và xác minh SHA-256; đã xóa object sau triển khai, xác nhận bucket còn 0 object. [Trạng thái runtime](evidence/ec2-2026-11-06/runtime.json), [kiểm kê AWS](evidence/ec2-2026-11-06/aws-inventory.json).

## Smoke test thực tế

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| API/Storefront HTTPS health, regions, catalog, trang `/vn` | PASS | [Smoke JSON](evidence/ec2-2026-11-06/smoke.json) |
| PostgreSQL `SELECT 1`, Redis PING | PASS | Smoke JSON |
| Backend và worker kết nối TCP tới PostgreSQL/Redis | PASS | Smoke JSON |
| Storefront gọi catalog Backend qua mạng Docker | PASS | Smoke JSON |
| Tổng kiểm tra script smoke | **12/12 PASS** | Smoke JSON |
| COD guest checkout qua HTTPS | **PASS**, một đơn mẫu | [Checkout JSON](evidence/ec2-2026-11-06/checkout.json) |
| Chứng chỉ TLS, redirect HTTP→HTTPS cho cả hai domain | PASS từ ngoài EC2 | [External checks](evidence/ec2-2026-11-06/external-checks.json) |
| Trang `/vn/store` chứa sản phẩm seed | PASS từ ngoài EC2 | External checks |
| Cổng 8000/9000/5432/6379 không truy cập được qua public IP | PASS từ ngoài EC2 | External checks |
| Tổng kiểm tra ngoài EC2 | **9/9 PASS** | External checks |

Đơn thử: `order_01M6RH130PCPAJYA5SYG3CEXX5`, sản phẩm `ao-thun-essential`, số lượng 1. Test tiêu thụ một đơn vị tồn kho demo, không thu tiền thật. Không chạy lại checkout chỉ để thu bằng chứng.

Giới hạn: checkout được kiểm tra qua API, chưa thao tác mua hàng thủ công bằng trình duyệt. TCP chứng minh kết nối mạng; chưa có bài kiểm chứng riêng một background job hoàn tất. Chưa đo tải/autoscaling, diễn tập khôi phục hoặc kiểm tra sao lưu tự động. Hai health endpoint không thay thế các bài kiểm thử đó. Chưa chạy quy trình GitHub Actions deployment; lần này triển khai qua SSM.

## Lỗi triển khai và cách xử lý

| Vấn đề | Xử lý / kết quả |
| --- | --- |
| AWS login hết hạn ở bước kiểm kê ban đầu | Người dùng đăng nhập lại; các lệnh AWS sau đó hoạt động. |
| GitHub SSH fetch thiếu public key | Fetch qua HTTPS; `master` đã nằm trong lịch sử local. Sau xác nhận, fast-forward `main` thêm 21 commit và phục hồi thay đổi local. Xung đột `.gitignore` được xử lý bằng cách giữ cả hai nhóm quy tắc. Backup stash vẫn còn. |
| EC2 `t3.medium` bị Free plan từ chối | Đọc thông báo lỗi, kiểm tra danh sách eligible và giá. Người dùng chọn `m7i-flex.large`; lần tạo mới thành công. Stack thất bại được rollback và loại bỏ trước khi tạo lại. |
| Compose checksum tham chiếu tên binary gốc | Sửa tên file tải về, xác minh checksum rồi cài. Đã sửa bootstrap source và áp dụng sửa trực tiếp qua SSM. |
| Buildx 0.12.2 của Amazon Linux quá cũ cho Compose | Cài Buildx chính thức 0.38.2, xác minh checksum theo định dạng binary; build sau đó thành công. |
| DNS ban đầu còn bật Cloudflare proxy | Người dùng chuyển hai record sang DNS only; DNS công khai sau đó trả đúng IP EC2. Caddy cấp chứng chỉ, HTTPS đạt. |

Các sửa bootstrap được áp dụng qua SSM trên host; source trong `deploy/ec2` đã cập nhật để dùng cho lần tạo sau. Không cập nhật user data của instance đang chạy bằng cách stop/start chỉ để sửa lịch sử CloudFormation.

## Chi phí thử nghiệm và dừng máy

AWS hiện báo Free plan ACTIVE; điều này không có nghĩa tài nguyên eligible không tiêu thụ credit. Giá được lấy từ AWS Price List API ngày 06/11/2026; public IPv4 đối chiếu [AWS VPC pricing](https://aws.amazon.com/vpc/pricing/).

| Thành phần | Đơn giá USD | Mô hình 4 giờ |
| --- | ---: | ---: |
| `m7i-flex.large` Linux On-Demand | 0.1197/giờ | 0.4788 |
| 1 public IPv4 | 0.005/giờ | 0.0200 |
| 30 GiB gp3 | 0.096/GiB-tháng; quy đổi 730 giờ/tháng | 0.0158 |
| **Tổng nền** | | **khoảng 0.5146 USD** |

Chưa gồm thuế, traffic, S3 staging requests/storage, snapshots và tài nguyên cũ. Nếu giữ disk đủ một tháng, riêng EBS khoảng **2.88 USD/tháng**, kể cả khi EC2 dừng. Không cộng chi phí RDS/ECR/secrets/KMS cũ vào chi phí bài thử Compose.

Tại lần thu bằng chứng chi phí, mô hình ghi nhận khoảng 0.317 giờ chạy, tương ứng khoảng 0.0407 USD; đây là tính toán theo thời gian, không phải hóa đơn. Cost Explorer trả giá trị 0 với `Estimated=true` cho tag thử nghiệm; dữ liệu này chưa đủ để quy thuộc hóa đơn do độ trễ và trạng thái/độ phủ cost allocation tag. **Không kết luận thử nghiệm miễn phí.** [Công thức, rates và kết quả kiểm tra billing](evidence/ec2-2026-11-06/cost-estimate.json).

Lịch systemd được xác minh sẽ yêu cầu shutdown lúc **17:16:39 UTC ngày 06/11**, tức **00:16:39 ngày 07/11/2026 giờ Việt Nam**. EC2 được cấu hình shutdown thành stop; giữ instance, EBS và Docker volumes. Tại thời điểm báo cáo máy còn running để xem thử. Lịch dừng đã được kiểm tra, nhưng chưa đến hạn để chứng kiến shutdown thực tế; đây không phải hard spending cap. Không xóa volumes hoặc dữ liệu bằng `down -v`.

SSM target: `i-011c2a03120ae1614`. Tài liệu vận hành nằm tại [deploy/RUNBOOK.md](../../deploy/RUNBOOK.md) và [deploy/ec2/README.md](../../deploy/ec2/README.md). Trước phiên sau cần kiểm tra/thiết lập lại lịch dừng, DNS/IP sau stop/start và credit trong AWS Settings → Billing.

## Tài nguyên AWS cũ

Kiểm kê cuối phiên xác nhận foundation cũ vẫn CREATE_COMPLETE, data cũ vẫn ROLLBACK_FAILED, retained guard vẫn UPDATE_COMPLETE; RDS cũ vẫn stopped. Lần thử EC2 không phục hồi hoặc thay đổi các stack Fargate/RDS đó. Kết quả Fargate trước đây vẫn có giá trị cho phạm vi API/worker đã thử; báo cáo này bổ sung bằng chứng cho đường triển khai EC2/Compose.

## Cập nhật trạng thái — 09/11/2026

EC2 demo hiện `stopped`; EBS 30 GiB gp3 mã hóa vẫn tồn tại và gắn với instance. Hai domain đã chuyển sang ALB của bản Fargate, nên các URL ở đầu báo cáo là địa chỉ của phiên thử EC2 trong quá khứ, không còn chỉ riêng EC2 demo. Xem [báo cáo Fargate](aws-fargate-deployment-2026-11-08.md). Các số liệu 12/12 smoke checks, 9/9 external checks và một đơn COD ở trên vẫn là bằng chứng của phiên 06/11; không phải kết quả đo tải hay độ sẵn sàng dài hạn.
