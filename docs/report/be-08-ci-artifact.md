# BE-08 — CI Artifact Status

- **Ngày:** 2026-11-20
- **Trạng thái:** **NOT PRODUCED — BE-08 is blocked.**
- **Revision checked:** `bd701245bcb97095ff75ac53a7681ab3920c457c`.

## Kết quả

Không có CI run hoặc downloadable CI artifact cho role-positive/negative HTTP/browser tests trong lần bàn giao này. Local HTTP suite tổng quát đã PASS trên PostgreSQL disposable, nhưng suite đó không chứa policy/guard role matrix đã duyệt nên không thay thế artifact CI. Không mô tả báo cáo này như artifact CI hay kết quả PASS.

Đã kiểm tra `.github/workflows/ci.yml` và `.github/workflows/api-tests.yml`:

- CI có PostgreSQL/Redis disposable trong job `verify` và chạy unit/HTTP suite tổng quát, nhưng không có bộ test Customer/Staff/Admin RBAC.
- `api-tests.yml` chạy integration HTTP trên PostgreSQL nhưng không có test role matrix.
- Không có bước upload artifact cho báo cáo BE-08 trong các workflow đã kiểm tra.
- Workflow `aws-images.yml` có upload-artifact cho một mục đích khác; điều đó không phải RBAC evidence.

## Artifact cần tạo sau khi gỡ blocker

Khi đã có policy được duyệt và guard server-side, CI cần chạy role-negative/positive suite trên DB test riêng và lưu tối thiểu:

- commit SHA và phiên bản Medusa;
- test command/job URL, môi trường và kết quả từng assertion;
- role fixture IDs đã giả danh (không email/token/PII);
- HTTP allow/deny status, xác nhận không đổi state khi deny;
- kết quả browser `/app` và Staff direct-API denial;
- log/trace đã giảm dữ liệu nhạy cảm.

Artifact phải được upload từ CI job sau khi test thực sự chạy; báo cáo Markdown này không thay thế file artifact hoặc kết quả GitHub Actions.

## Tham chiếu

- [Role-negative HTTP/browser test report](./be-08-role-negative-http-browser-test-report.md)
- [Permission Matrix v1](../technical/staff-admin-permission-matrix.md)
- [CI workflow](../../.github/workflows/ci.yml)
- [API tests workflow](../../.github/workflows/api-tests.yml)
