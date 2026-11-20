# Kiểm chứng tích hợp dependency và OPS — 20/11/2026

Phạm vi: phần tiếp tục PR #18 sau checkpoint 19/11; không triển khai ứng dụng lên AWS. Metadata audit ghi riêng revision, trạng thái dirty và checksum lockfile; CI trên commit sạch là bằng chứng tiếp theo.

## Quyết định và phát hiện

- Giữ Medusa 2.22.7, UI 4.2.14, Next 15.5.29, TypeScript 6.0.3 và npm 11.12.1.
- Rushstack/AJV dùng override hẹp và neo dependency root để npm áp dụng qua workspace. Các peer AJV 6/8 tách đúng major.
- Bác bỏ thử nghiệm BullMQ 5.81.5: seed với Redis thật lỗi `Priority should be between 0 and 2097151`. Giữ BullMQ 5.13.0 mà Medusa ghim; chỉ vá UUID sang 11.1.1, có CommonJS và API v4 mà BullMQ sử dụng. Không coi audit sạch là chứng minh tương thích.
- Docker thêm NODE_PATH backend-local và root, để các CLI trực tiếp nạp được plugin Medusa đặt trong workspace.
- `npm ls --all` từng báo peer không hợp lệ; đã sửa. Còn hai optional-package dư do npm cài Sharp WASM và Emnapi nhưng không liệt kê đúng vị trí root trong lock. Không tự thêm hai package không dùng vào manifest để làm xanh inventory; ghi riêng exit code, kiểm native Sharp bằng build/media và tiếp tục rà artifact.

## Kết quả kiểm chứng

| Phạm vi | Kết quả |
| --- | --- |
| Clean `npm ci`, Node 24.22.1 / npm 11.12.1 | PASS; 0 vulnerabilities |
| Audit toàn cây với `--enforce` | PASS, AUDIT_CLEAR; 0 finding mọi severity; metadata ghi dirty working tree |
| Lint và typecheck toàn workspace | PASS |
| Backend unit + policy security | PASS: 155 unit, 19 policy |
| HTTP trên bản sao không có env, PostgreSQL/Redis dùng riêng | PASS: 7 suite, 32 test; 3 k6 opt-in SKIP trong lượt này |
| k6 riêng trên DB mới do run sở hữu | PASS: 3 test; catalog/COD retry + đối soát stock, DB fault/recovery, invalid key |
| BullMQ 5.13.0 / UUID 11.1.1 trên Redis mới | PASS: priority 2097152 như internal event Medusa, retry sau lỗi tổng hợp, completed và duplicate jobId không tạo job thứ hai; không suy ra exactly-once notification |
| Packaged backend/Admin + migration + catalog | PASS: build, seed với Redis, dry-run/apply, stock change và rerun giữ stock, invite CLI, 33 sản phẩm (30 DAYMARK + 3 bootstrap), ảnh HTTP, Admin HTML/asset, API/worker health và storefront HTTP; tài nguyên dùng riêng đã dọn |
| Presentation build/test + IaC | PASS: build, 10 presentation test; 27 IaC test |
| Inventory `npm ls --all` | Chưa PASS: 2 optional package extraneous (Sharp WASM/Emnapi); không còn invalid peer. `npm prune` không loại discrepancy, không coi exit code là PASS |
| Browser suite và Docker image trên commit cuối | NOT RUN locally; CI browser-container cần chạy đúng head mới |

Hai lượt k6 đầu lỗi môi trường kiểm thử (dotenv cục bộ được nạp lại khi Redis rỗng; rồi Docker Unix socket không được truyền vào env allowlist). Lượt cuối chạy bản sao không chứa env và chỉ truyền socket Unix của daemon local; không thay code nghiệp vụ hoặc bỏ assertion để đạt.

[Metadata audit](evidence/ops-dependency-integration-2026-11-20/audit-metadata.json) và [audit không finding](evidence/ops-dependency-integration-2026-11-20/audit.json). Raw log local không commit vì có thông tin fixture/phiên test; CI tạo artifact hạn chế truy cập theo hợp đồng kiểm chứng.

## AWS và giới hạn

Đọc trạng thái bằng profile aws-project, vùng ap-southeast-2 sau đăng nhập: app stack absent; RDS stopped; Redis stopped; lease 0. Foundation/data vẫn tồn tại, không xóa dữ liệu/catalog/media/Admin. Đây không phải sao kê chi phí hoặc bảo đảm tài nguyên giữ lại không tính phí.

SNS confirmation/test alert hoãn theo yêu cầu. Branch protection cần chủ repository thực thi cấu hình đã chuẩn bị; không có quyền Admin để áp dụng. Staff bị chặn toàn bộ Admin API là ranh giới an toàn, không thay nghiệm thu lifecycle/assignment BE-08. Không chứng minh restore/rollback, tải dài/5x/10x hoặc giao notification từ các smoke dưới đây.
