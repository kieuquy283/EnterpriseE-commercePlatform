# Phase 00 — Audit baseline, dữ liệu và feasibility

**Mô tả đơn giản:** Kiểm tra hệ thống thật đang có gì, khách hàng thật có dữ liệu gì, và giới hạn pháp lý/kỹ thuật nào phải giải quyết trước khi cá nhân hóa.

## Inputs

- `docs/recommendation/{plan.md,spec.md}`, `docs/recommendation/pdp/`, `docs/recommendation/hybrid/` nếu có; Project Definition / Scope / SRS.
- Medusa `apps/backend/src/modules/recommendation/`, Store API, Frontend auth/cart/orders; source branch/working tree.
- H&M local CSV/mapping (nếu khả dụng), báo cáo quyền; chỉ profile tối thiểu trong private sandbox.

## Tasks

1. Ghi commit SHA, branch, diff và các migration active; xác nhận có/không có per-user routes, events, DB stores. Không giả định Hybrid V2 đã push/merge.
2. Khảo sát số registered customers, orders và consented recommendation events (nếu có) bằng **aggregate read-only**; không đưa PII vào report. Phân biệt số account với active user có history.
3. Chốt P0 personalized rail, users/sessions supported, feature flags, store region/channel và quyền dữ liệu; owner ra quyết định privacy.
4. Rà trực tiếp chi phí API hydration/fallback: PDP load từng FAIL 30 RPS; xác định điểm chung với For You.
5. Thiết lập isolated test DB, synthetic customers, no production write. Lập risk register và decision log.

## Expected deliverables

- `reports/phase_00_report.md`, evidence aggregate, source/manifest SHA, accepted ADR về MVP vs CF, migration impact matrix.
- Freeze baseline/evaluation, nêu điều kiện P0/P1 độc lập.

## Exit criteria

- [ ] Repo/DB/catalog evidence đối chiếu được (hoặc `BLOCKED` ghi nguyên nhân).
- [ ] Identity/permissions và dữ liệu tracking hiện có được phân loại, không suy đoán “đủ data để ALS”.
- [ ] Rights H&M và luật bảo vệ dữ liệu có chủ sở hữu quyết định; private-only nếu chưa verified.
- [ ] Có performance risk register và không sửa commerce ở Phase 00.
