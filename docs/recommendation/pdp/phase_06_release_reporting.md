# Phase 06 — Review, release decision & handover

> **ID:** REC-PDP-P06 · **Phụ thuộc:** P05 hoàn tất (kể cả outcome NOT_MET/BLOCKED) · **Ưu tiên:** P0
> **Spec:** `PDP-NFR-05`, `PDP-T13/T14` trong [spec.md](spec.md).
> **Reports:** `docs/recommendation/pdp/reports/phase_06_report.md`, `final_implementation_report.md`.

## 1. Mô tả đơn giản

Tổng kết có gì thật sự hoạt động, test nào đã đạt, còn lỗi gì, có thể dùng trong demo nội bộ không và có được phép public hay chưa. Sau đó bàn giao cách chạy/rollback và chuẩn bị PR vào `main` nếu cần.

## 2. Đầu vào

- Reports Phase 00–05 và system test; commit SHA target, mã nguồn đang kiểm tra.
- Rights decision H&M/ảnh và human relevance review (hoặc NOT_RUN có lý do).
- Runbook private pilot hiện tại, release/env flags, PR review rules của repo.

## 3. Việc cần làm

1. Audit implementation/contract: spec requirement → code path → tests → measured evidence. `MET / PARTIAL / NOT_MET / BLOCKED / NOT_RUN` không được coi như nhau.
2. Review security/privacy: không lộ customer/H&M raw IDs, secrets, scores/private metadata, logs chỉ aggregate; quyền dataset/ảnh/public scope theo quyết định hợp lệ.
3. Tổng kết human relevance sample: ai review, bao nhiêu PDP contexts, score, trường hợp gợi ý sai và fallback. Nếu chưa có reviewer thì ghi **NOT_RUN** và không claim quality validation.
4. Chốt target branch: nếu cần feature ở `main`, tạo PR từ nhánh cập nhật `main`, bảo toàn payment/core commerce đã có; chạy CI/E2E trên HEAD của PR; không merge khi CI/required review chưa đạt.
5. Chốt private demo: bật flags có kiểm soát, version ready, test dataset hợp lệ; ghi cách OFF khi sự cố và cách restore ready version.
6. Chốt public demo riêng: chỉ GO khi quyền metadata/ảnh/candidate derivations được xác nhận, bảo mật/data review thông qua và có human relevance (nếu tiêu chí yêu cầu); ngược lại **PUBLIC NO-GO**.
7. Cập nhật runbook một cách có kiểm soát, tránh tạo bản hướng dẫn thứ hai mâu thuẫn. Ghi cách launch profile test và cách kiểm URL/response.
8. Viết final report với commit/test environment/versions, IDs, số Product/candidates, latency PDP thực, pass/fail/blocker, scope not done, rủi ro và next steps.

## 4. Tài liệu bàn giao bắt buộc

| Tệp cần tạo khi triển khai | Nội dung |
|---|---|
| `reports/phase_06_report.md` | Lệnh review, evidence, findings/fixes, gate outcome |
| `reports/final_implementation_report.md` | Tổng kết phase 00–06, API/PDP, test/NFR, GO/NO-GO |
| `reports/system_test_report.md` | Tham chiếu report từ P05; sửa nếu rerun sau fixes |
| `docs/recommendation/runbook.md` | Cập nhật runbook hiện hữu; tránh bản copy lỗi thời |
| PR tới `main` (nếu có) | CI, reviewers, doc links; không claim merge khi chưa merge |

## 5. Review checklist

- Không có phần mới ngoài scope PDP; Home recommendation hiện có không bị xóa/hỏng.
- Các link trong docs và report có thể truy cập; số liệu đo có run ID/config.
- Flags OFF rollback được kiểm tra, không cần xóa/reseed DB commerce.
- Không có bí mật, raw H&M CSV, customer hashes và quyền chưa chứng minh trong PR.
- Chỉ gọi quality/PDP performance PASS khi đã chạy tương ứng; không suy Home benchmark.
- Hạn chế native Medusa internal adapter, một-VM, private data rights được ghi rõ.

## 6. Release decision

| Trường hợp | Verdict hợp lệ |
|---|---|
| API/PDP/regression pass trên local/private test; rights chưa rõ | **PRIVATE DEMO GO / PUBLIC NO-GO** |
| Thiếu mapping/DB/required API tests | **PRIVATE NO-GO**, tiếp tục xử lý blocker |
| Public rights đã có nhưng relevance/NFR/test chưa đạt | **PUBLIC NO-GO** cho đến khi gap được chấp nhận bằng văn bản hoặc sửa |
| Mọi required gate + permissions + reviewer pass | Có thể đề xuất **PUBLIC GO**, không tự khẳng định production-ready/SLA |

## 7. Exit gate

Phase hoàn tất khi đã có **honest final verdict**, system test report, traceability, runbook, rollback, quyền dữ liệu và PR status minh bạch. **`NO-GO` vẫn có thể là kết quả báo cáo đúng**, không tự động tính feature release PASS.
