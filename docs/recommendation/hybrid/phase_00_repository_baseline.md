# Phase 00 — Repository baseline & safety

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** không · **Owner:** Tech Lead/DevOps · **Estimate:** 1–2 person-days (giả định). Phase này khóa đúng mã nguồn, quyền sử dụng và môi trường thử trước khi làm ML. Không ghi vào commerce DB ở bước audit.

**Already exists:** Recommendation module/API và PDP code trên `recommendation-pdp` (`apps/backend/src/modules/recommendation/`, `apps/storefront/src/modules/products/components/related-products/index.tsx`); dataset rights decision tại `docs/recommendation/dataset-rights-decision.md`. **Missing:** baseline v2 và public permission record. **Unverified:** current target DB identity, remote PR state khi bắt đầu triển khai, model license.

**Inputs:** [plan](plan.md), [spec](spec.md), source/CI, local ignored manifests. **Outputs:** environment/source inventory, DB/test isolation decision, rights log. **Files:** existing `.github/workflows/ci.yml`, `apps/backend/medusa-config.ts`, `deploy/docker-compose.recommendation-test.yml`; proposed `docs/recommendation/hybrid/reports/phase_00_report.md` (chưa có).

1. **P0** Ghi branch, HEAD, remote heads, dirty tree; so `main`/`recommendation`/`recommendation-pdp` mà không đổi branch. Lệnh: `git status --short`, `git rev-parse HEAD`, `git ls-remote origin refs/heads/main refs/heads/recommendation-pdp`.
2. **P0** Xác minh DB dùng cho write/migrations là disposable riêng; chỉ đọc DB dùng chung. Ghi DB name/host class, không ghi credential.
3. **P0** Xác minh Kaggle rule/ảnh/derived embedding/model license và quyết định private/public có người phụ trách.
4. **P1** Inventory source/tests/CI; phân biệt code với report cũ. Kiểm tra ignored artifacts bằng `git status --short` và `git check-ignore data/hm/processed/catalog.jsonl`.

**Acceptance:** Given repo và test stack, when audit kết thúc, then SHA/branch/DB identity/rights đều có nguồn, và không có DB write. Given quyền public chưa rõ, when quyết định, then public NO-GO. **Gate:** PASS nếu baseline + private isolation đủ cho Phase 01/02; BLOCKED với DB write nếu chưa chứng minh isolated DB. **Risk/fallback:** stale refs hoặc quyền thiếu → audit read-only/private. **Rollback:** không có data mutation. **Core commerce:** không ảnh hưởng. **Next:** Phase 01 và 02 song song. Báo cáo khi triển khai: `reports/phase_00_report.md` (proposed).
