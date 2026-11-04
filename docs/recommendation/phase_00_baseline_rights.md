# Phase 00 — Source Baseline, Scope & Dataset Rights

> **Status:** PASS cho local/private development; public NO-GO. [Report](reports/phase_00_report.md). **Priority:** P0 để khởi động optional Recommendation.
> **Depends on:** quyền truy cập repository và dữ liệu local. **Next:** [Phase 01](phase_01_data_readiness.md).
> **Reference:** [Plan](plan.md) · [Spec](spec.md) (`DEC-01`, `DEC-02`, `REC-DATA-03/04`).

## 1. Mô tả đơn giản

Trước khi tính gợi ý, cả nhóm phải biết **đang làm trên commit nào**, dữ liệu nào được dùng và **có được phép dùng H&M/ảnh trong demo công khai không**. Phase này không viết Recommendation API, không import dữ liệu mới.

## 2. Inputs / prerequisites

- `main` và `recommendation` trên remote; code local và working tree của người phụ trách.
- `docs/01_Project_Definition.md`, `docs/02_Project_Scope_and_Assumptions.md`, `docs/03_Software_Requirements_Specification.md` (phạm vi Recommendation optional).
- Kaggle competition terms/license và bằng chứng nguồn tải dữ liệu H&M; policy của nhóm cho media/dataset.
- `data/hm/` trên máy nội bộ nếu có; **không upload raw datasets chỉ để làm tài liệu**.

## 3. Tasks / execution

- [ ] **00.1 Branch audit:** ghi `git status`, `git fetch`, `git rev-parse HEAD`, `git log -5 --oneline`, `git branch -vv`, so sánh với remote; không `reset --hard`/force push.
- [ ] **00.2 Resolve baseline:** plan cũ ghi local merge `024bf27`, nhưng remote `recommendation` được kiểm tra 2026-11-04 vẫn trỏ `a98457c` trong khi remote `main` ở `f4845ba`. Kiểm tra commit mới có trên local/chưa push hay không; chốt một feature branch từ `main` hiện hành. Chỉ push khi có review và quyền.
- [ ] **00.3 Scope freeze:** chỉ giữ `home` Popularity (12) + `product_detail` Similarity (6); không nhận customer-personalization/CF/cart/LLM.
- [ ] **00.4 Data rights:** ghi nguồn dữ liệu, điều khoản áp dụng, điều kiện chia sẻ code/dữ liệu, quyền ảnh và nơi public demo; nếu chưa chắc, chọn private/offline demo hoặc assets có quyền thay thế.
- [ ] **00.5 Secret/privacy:** kiểm `.gitignore`, không in hoặc commit email, HMAC key, raw H&M CSV, customer hashes/ảnh.
- [ ] **00.6 Technical baseline:** xác nhận Medusa v2.21.2 và package versions đang được build/test, ghi đầu ra CI/health và các blockers liên quan PostgreSQL connection exhaustion trước đây.

## 4. Files / outputs

- **Cập nhật:** `docs/recommendation/plan.md`, `docs/recommendation/spec.md` và file này.
- **Nếu cần tạo tài liệu mới:** `docs/recommendation/dataset-rights-decision.md`, `docs/recommendation/evidence/source-baseline.md` — chỉ ghi kết quả có thật, không tự xác nhận được cấp phép.
- Không sửa các file ngoài `docs/recommendation/` trừ khi PR triển khai có phạm vi được review; phase này ưu tiên audit.

## 5. Acceptance criteria (GO/NO-GO)

- [ ] Branch + exact SHA + status CI được ghi và cả nhóm dùng cùng baseline.
- [ ] Có quyết định rõ **public / private / blocked** cho dữ liệu H&M và ảnh; nếu chưa rõ quyền public thì public release phải **NO-GO**.
- [ ] Không có raw datasets, secret keys hoặc personal identifiers trong Git/evidence.
- [ ] Project Definition/Scope/SRS xác nhận Recommendation là optional, không chặn checkout/cloud milestones.

**GO Phase 01:** có baseline ổn định, dữ liệu dùng offline trong phạm vi cho phép; quyền public có thể còn blocked và được ghi rõ. **NO-GO public demo** nếu thiếu quyền.

## 6. Risks, rollback, handoff

- **Rủi ro:** merge/rebase mất code chưa commit, hai thành viên dùng các SHA khác nhau, public assets không có quyền. **Mitigation:** feature branch, PR, backup local, secret scanning và rights decision.
- **Rollback:** không sửa dữ liệu hoặc production trong phase này; rollback tài liệu/PR, không xóa DB.
- **Handoff:** Data lead → Phase 01 với source SHAs, rights status, local artifact locations (không chứa secrets), danh sách open decisions.

## 7. Evidence template

| Commit SHA | Environment | Rights decision | Reviewer | Result | Link |
|---|---|---|---|---|---|
| _Điền khi chạy_ | _Điền_ | _Public/private/blocked_ | _Điền_ | _GO/NO-GO_ | _Evidence_ |
