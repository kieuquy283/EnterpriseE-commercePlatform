# Kiểm chứng bảo mật runtime image — 21/11/2026

Phạm vi: khắc phục image của PR #18 trước khi bật traffic; không cấp ngoại lệ scan hoặc tự gia hạn compute. Kết quả local dưới đây không thay scan ECR theo digest và kiểm thử browser/container trên commit phát hành.

## Phát hiện và quyết định

- Image Bookworm từ source `091f68e` có 7 HIGH OS mỗi image trong ECR: util-linux (3), zlib (1), apt (1), PAM (1), glibc (1). Traffic đã giữ ở 0; migration một lần đã đạt và snapshot `daymark-pre-091f68e-20261120` được tạo trước migration. Không reset/seed dữ liệu hoặc Admin.
- Chọn Node 24.22.1 / Alpine 3.24 theo ADR-11; pin base digest và cập nhật distro. Alpine dùng musl, cần native/runtime regression. [zlib có bản vá Alpine 1.3.2-r1](https://security.alpinelinux.org/vuln/CVE-2026-85091); không dùng lý do chưa có bản vá Bookworm để miễn trừ finding.
- Trivy phát hiện thêm 6 HIGH trong npm global (brace-expansion, undici), ngoài lockfile ứng dụng. Giữ npm ghim cho build, xóa npm/Yarn global khỏi runtime; chạy Medusa/Next trực tiếp bằng Node với working directory tương đương. App dev dependencies vẫn tồn tại; không gọi đây là image tối giản hoàn toàn.
- SWC 1.16.18 lỗi SIGBUS trên musl; pin patch 1.16.20 sau native probe thành công. Không bỏ postinstall, không dùng compiler thứ hai hoặc tắt assertion. Lượt build đầu lỗi mạng ECONNRESET; cache npm chỉ phục vụ build, không bake cache vào runtime.

## Kiểm chứng local

| Kiểm tra | Kết quả |
| --- | --- |
| Backend/Admin và storefront image build | PASS |
| Trivy 0.72.0, OS và library, không ignore unfixed | PASS: 0 HIGH/CRITICAL ở cả hai candidate |
| Backend unit chạy bên trong Alpine | PASS: 17 suite, 155 test |
| Native SWC transform; Sharp PNG resize sang WebP | PASS |
| Npm audit toàn cây với pin Node/npm và --enforce | PASS: AUDIT_CLEAR, 0 finding |
| IaC và release workflow policy tests | PASS: 38 test; lỗi/missing counts, scan không hỗ trợ, wait failure, mutable digest và từ chối trước compute |
| actionlint, docs và diff checks | PASS |
| Guard đọc trạng thái AWS thật | PASS: từ chối digest đang staged có HIGH trước đổi lease/capacity |

[Metadata candidate, base digest và DB scanner](evidence/runtime-images-2026-11-21/local-scan-summary.json). CI lưu report đầy đủ cho image thực của từng SHA; ECR scan phải COMPLETE với HIGH/CRITICAL bằng 0 trước khi chấp thuận reference phát hành. Không chuyển số local thành kết quả ECR hoặc nghiệm thu cloud.

## Kiểm soát và giới hạn

CI browser-container quét cả OS/library sau build và kiểm browser/runtime. Workflow công bố image chờ ECR scan và dùng chung validator với `manage.py start`; guard startup đọc digest của stack hiện hành và chỉ nhận repository foundation. Không được tăng task count khi gate lỗi. Policy publisher nguồn thêm quyền đọc scan cho đúng hai repository; chưa tự áp dụng thay đổi role/IaC lên AWS.

Lượt kiểm trạng thái 21/11: app stack tồn tại nhưng cả API/worker/storefront desired/running đều 0; RDS/Redis stopped; lease trước đã hết hạn. ALB và tài nguyên giữ lại vẫn có phí. Không khẳng định preview đã hoạt động, không gia hạn demo trong tác vụ khắc phục image. Kiểm thử cloud/browser trên source/digest cuối được đối chiếu qua artifact/PR, không suy từ build hoặc scan đơn lẻ.
