# Phase 00 — Audit repository & bảo vệ dữ liệu

> **ID:** REC-PDP-P00 · **Phụ thuộc:** Không · **Ưu tiên:** P0
> **Spec:** [spec.md](spec.md) · **Master:** [plan.md](plan.md)
> **Báo cáo triển khai cần tạo:** `docs/recommendation/pdp/reports/phase_00_report.md` (chỉ sau khi chạy audit).

## 1. Mô tả đơn giản

Xem lại những gì nhóm đã xây dựng và bảo đảm mọi người chạy trên **cùng một phiên bản code**, với **database thử nghiệm an toàn** và quyền dùng H&M được ghi rõ. Không viết lại API hoặc similarity khi chúng đã có trên `recommendation`.

## 2. Mục tiêu

- Khóa commit SHA/branch cho công việc PDP; có kế hoạch PR đưa code sang `main` nếu cần.
- Xác nhận implementation thực tế từ `recommendation`, không nhầm báo cáo cũ với kết quả hiện tại.
- Chốt private demo/public release, quyền dữ liệu, ảnh, metadata và secrets.
- Bảo đảm integration/fault/load tests không tác động DB commerce/volume dùng chung.

## 3. Đầu vào

- `docs/recommendation/plan.md`, `spec.md`, báo cáo trong `docs/recommendation/reports/`.
- `git status`, `git log`, `git diff main...recommendation`, cấu hình repo hiện tại.
- `docs/recommendation/dataset-rights-decision.md`, `docs/recommendation/runbook.md`.
- `.gitignore`, `deploy/docker-compose.recommendation-test.yml` và cấu hình flags.

## 4. Việc cần làm theo thứ tự

1. Đọc tất cả file nguồn chính trên branch làm việc; ghi baseline SHA, Node/Medusa/Next/Python/DB versions, `git status` và các thay đổi chưa commit. Không reset mất local work.
2. Liệt kê implementation cần **reuse**: offline script, Medusa module/migrations/workflow, API, Next data helper, PDP component, tests.
3. Chọn chiến lược tích hợp: branch feature từ `main` mới nhất, cherry-pick/merge có kiểm soát phần cần thiết; ghi conflicts, không ép force-push hoặc merge production tự động.
4. Xác nhận môi trường DB test riêng bằng project name/db name và backup policy; đặt guard chống migration-down/volume deletion trên DB thương mại.
5. Kiểm tra data rights/nguồn H&M. Nếu chưa rõ, ghi `PRIVATE ONLY`, `PUBLIC NO-GO`, không lấy ảnh/CSV từ nguồn không được phép và không public serving artifacts.
6. Chốt required envs và runtime flags mà không commit key/password. Test `ENABLE_RECOMMENDATIONS=false` và `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=false` là trạng thái an toàn mặc định.
7. Lập audit checklist file được giữ, file cần sửa, test cần chạy lại và release blockers.

## 5. Output của phase

- Tạo report: `reports/phase_00_report.md`, ghi status thực tế, SHA, environment, evidence links.
- Nếu quyết định mới khác bản quyền hiện có, sửa **chính** `docs/recommendation/dataset-rights-decision.md` theo PR; không tạo tuyên bố quyền giả.
- Checklist source-to-spec và kế hoạch tích hợp Git có owner.

## 6. Verification/Test/Review

- `git status` + SHA hợp lệ; mọi link của phase tới file trong repo resolve được hoặc ghi rõ missing.
- `.gitignore` không theo dõi `data/hm/processed`, raw CSV/hash, secret files.
- DB test được nhận diện rõ; chỉ dry-run/read-only trước khi chạy migration.
- Review security: không log token/customer IDs, chưa dùng bất kỳ lệnh destructive nào.

## 7. Exit gate

**PASS** khi commit/branch, data rights, flags, test environment, integration strategy và blockers được ghi đầy đủ. **BLOCKED public** nếu chưa xác minh quyền, nhưng có thể **PASS private** cho development/test cô lập. Không gọi phase PASS nếu test DB và target branch chưa xác định.

## 8. Khi gặp lỗi

Không xóa local DB hay ép Git reset. Ghi blocker với bằng chứng; tiếp tục chỉ các tác vụ audit/đọc an toàn. Không chuyển phase phụ thuộc vào mapping chưa được xác nhận.
