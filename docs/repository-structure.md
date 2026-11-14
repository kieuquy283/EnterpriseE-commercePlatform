# Cấu trúc repository

Đây là npm workspace dùng Turborepo, gồm backend Medusa và storefront Next.js. Bảng dưới mô tả trách nhiệm theo mã nguồn hiện tại, không phải danh sách tính năng dự kiến.

| Đường dẫn | Trách nhiệm |
| --- | --- |
| `apps/backend/` | Cấu hình và chạy Medusa API/Admin; seed dữ liệu commerce, API routes và các phần mở rộng Medusa. Chịu trách nhiệm logic và dữ liệu commerce. |
| `apps/storefront/` | Giao diện Next.js cho khách hàng; gọi Medusa Store API bằng JS SDK và publishable key. Chịu trách nhiệm trang sản phẩm, tài khoản, giỏ hàng và checkout. |
| `deploy/` | Runbook chính và CloudFormation cho ALB/Fargate/RDS/Redis EC2/private S3 proxy; EC2/Compose/Caddy được giữ riêng làm fallback. Bản AWS đã có 14 public checks ngày 09/11/2026. |
| `load/` | Kịch bản k6 cho catalog và checkout; dùng để kiểm tra tải khi có môi trường phù hợp. |
| `scripts/` | Tiện ích PowerShell cho môi trường local và smoke test checkout. |
| `.github/workflows/` | `ci.yml` kiểm tra code và CloudFormation; `aws-images.yml` publish ECR qua OIDC (chưa được live report thực thi); `deploy.yml` chỉ là workflow SSH cho EC2 fallback. |

Luồng phụ thuộc chính: **Storefront → Medusa Backend → PostgreSQL / Redis**. Storefront gọi Store API; backend lưu dữ liệu commerce trong PostgreSQL và dùng Redis theo cấu hình Medusa cho cache, event bus, workflow và locking. Compose local khởi động PostgreSQL/Redis mặc định; backend, worker và storefront nằm trong profile `app`.

| File gốc | Vai trò |
| --- | --- |
| `package.json` | Khai báo npm 11, workspace scripts và lệnh Turbo (`dev`, `lint`, `typecheck`, `build`). |
| `turbo.json` | Khai báo task graph và output cache của Turborepo. |
| `docker-compose.yml` | Cấu hình PostgreSQL, Redis và các service ứng dụng/profile cho local. |
| `.env.example` | Mẫu biến môi trường; sao chép thành `.env` local và không commit secret. |

Xem [README.md](../README.md) để setup local và [deploy/RUNBOOK.md](../deploy/RUNBOOK.md) để biết phạm vi triển khai.
