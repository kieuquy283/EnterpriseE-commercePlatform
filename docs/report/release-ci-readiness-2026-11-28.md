# R-OPS01/02 — kiểm chứng thông báo xuyên tiến trình

Số liệu dưới đây ghi nhận lần chạy lịch sử trên phiên bản trước khi tách Staff khỏi PR #29. Kết quả CI của bản cập nhật được ghi trên PR.

Ngày 28/11/2026; nhánh `feat/release-ci-readiness`. Base mới nhất: `46c44bbcd46618cb35f6f0d95dcc76e8f433cb2f` (PR #28 đã merge trong lúc thực hiện). Phạm vi bổ sung theo yêu cầu: bỏ qua owner branch protection; hoàn thiện Staff-positive, notification worker/inbox và CI. Không merge PR #24/#27, không triển khai AWS hoặc gửi email ra ngoài.

## Phạm vi chức năng

- `/staff/me`, `/staff/orders/:id`, `/vn/staff`: tra cứu đơn thuộc assignment do Admin quản lý trong User metadata, DTO tối thiểu, cookie Staff riêng và kiểm lại role/assignment trên mỗi request. Giữ full Admin API bị chặn. Không tin metadata từ cart/order; kiểm thử metadata giả không cấp quyền.
- SMTP adapter dùng Nodemailer; timeout hữu hạn, production yêu cầu TLS, lỗi không chứa credentials/recipient. Thiếu transport ở production ghi failure thay vì sandbox success ngầm.
- Redis lock bọc read/claim/send/persist; job mỗi 10 giây với batch giới hạn, reclaim processing hết lease. Lỗi lưu audit sau khi đã lưu sent không mở lại record để gửi lần nữa. SMTP và database không cùng transaction; vẫn at-least-once nếu chết giữa SMTP acceptance và persist.
- CI dùng network/container/volume riêng theo run label. PostgreSQL/Redis không publish cổng; API/storefront/inbox chỉ bind loopback. Importer giữ guard localhost bằng namespace PostgreSQL. Public URL frontend tách internal backend URL trong build/runtime. Credential ngẫu nhiên trong file `0600`, không command arguments, trace hoặc artifact.

Thiết kế và giới hạn: [ADR-013](../06-architecture/adr/ADR-013-smtp-verification.md); [hợp đồng CI](../technical/ci-verification.md).

## Bằng chứng thực thi

| Kiểm tra | Kết quả local |
| --- | --- |
| Clean install Node 24.22.1 / npm 11.12.1 | PASS; không thay package manager |
| Npm audit toàn cây, `--enforce` | AUDIT_CLEAR, 0 finding |
| Unit backend | 161 PASS / 19 suite, gồm SMTP config/TLS/sanitized error |
| HTTP toàn bộ trên latest main và fault-audit bổ sung | 43 PASS, 3 opt-in load SKIP |
| Staff/outbox HTTP sau fault-audit bổ sung | 8 PASS / 2 suite; không cộng lại vào số HTTP trên |
| Backend/Admin và storefront production image build | PASS |
| Admin browser | Login, English → Français → English, navigation/reload, 0 JS exception: PASS |
| Staff API/browser | Assigned DTO, no PII, unassigned/anonymous/mutation/Admin deny, reassignment, Secure/HTTP-only cookie, persisted revoke: PASS |
| API → Redis → worker → SMTP → Mailpit inbox | Confirmation thật trong inbox test, replay không thêm effect: PASS |
| Provider outage/recovery | Order vẫn tồn tại, retry_wait/attempt bền vững, gửi được sau khởi động lại inbox: PASS |
| Worker restart/expired lease | Dừng worker, tạo đơn, thiết lập processing hết lease bằng fixture, khởi động lại, nhận inbox: PASS |
| Competing processes | Hai CLI process độc lập tranh cùng record qua Redis: một successful attempt/một message: PASS |
| Cancellation notification | SMTP inbox nhận email hủy đơn: PASS |
| Đối soát Ops fixture | 4 đơn synthetic được hủy và stock về snapshot ban đầu: PASS |
| Storefront Chromium trên base PR #28 | 23 PASS, 6 H&M fixture SKIP |
| Hai image Trivy 0.72.0, OS/library, không ignore unfixed | 0 HIGH/CRITICAL ở lượt đã quét; metadata ghi image content ID |
| Audit policy / IaC / presentation | 19 / 39 / 10 test PASS; presentation build PASS |
| Lint/types, shell/JS syntax, actionlint, docs, format, diff | PASS; kiểm lại sau cập nhật cuối |

Lượt container cuối trên base PR #28 đạt 8 scenario Ops, 4 Admin compatibility checks và 23 browser case. Node base thực tế có npm 11.19.1; sau khi phát hiện, Dockerfile thêm pin npm 11.12.1 cùng build-only cache. Clean install/audit/unit trên host dùng đúng npm 11.12.1; local image proof ở trên có trước thay đổi builder pin cuối. GitHub phải rebuild/scan/test image với pin mới trên SHA thực; không suy kết quả này từ lượt local. [Metadata và scenario verdict đã rút gọn](evidence/release-ci-2026-11-28/summary.json). Raw audit/Trivy/log ở artifact local/CI; không công bố credential.

Các lượt thử lỗi được giữ riêng: cài npm khác pin bị ngắt, mạng tải RDS CA gián đoạn, rootless topology cũ không phù hợp, fixture order thiếu region và selector alert trùng route announcer. Không tính các lượt đó PASS. Certificate download có retry hữu hạn và kiểm PEM/TLS; không miễn trừ lỗi. Topology mới chạy được với Docker rootless; selector giới hạn trong Staff page. Fault-audit được tiêm qua container dependency riêng, kiểm state sent không bị mở lại.

## Owner protection và giới hạn

Owner branch protection **SKIPPED theo yêu cầu người dùng**, không phải đã enforce. Không thay quyền GitHub hoặc native required-check config. Tài khoản chỉ có push/triage, không admin/maintain; API protection trả 404 ở lần đọc.

`npm ls --all` vẫn báo hai optional package extraneous (`@emnapi/runtime@1.11.3`, `@img/sharp-wasm32@0.35.5`), không có invalid peer trong danh sách problem; không gọi inventory này PASS. Audit clear không thay kiểm kê image.

Staff chỉ đọc, chưa có lifecycle/invite vận hành đầy đủ hoặc mutation fulfillment/COD/reporting. SMTP receipt là inbox test Mailpit, không phải email provider Internet/customer receipt; không chứng minh exactly-once hoặc SLO 95%/60s dưới tải. Worker restart test có fixture expired lease trước send, không phải kill tại mọi điểm send/persist. Không đo cloud peak/restore/rollback/alert hoặc gọi AWS trong lượt này. R-OPS03..05 và full RC sau các PR dữ liệu vẫn là nghiệm thu riêng.
