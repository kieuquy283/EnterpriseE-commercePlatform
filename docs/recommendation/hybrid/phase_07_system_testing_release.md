# Phase 07 — System testing & release decision

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 05 và 06; 01–04 evidence · **Owner:** QA + DevOps + Product/Data owner · **Estimate:** 3–5 person-days (giả định). Chạy lại toàn bộ phần liên quan trên cùng SHA và môi trường thử riêng. Chỉ mở v2 khi chất lượng, an toàn dữ liệu và tốc độ đều đạt tiêu chí đã chốt.

**Already exists:** `.github/workflows/ci.yml`, `api-tests.yml`, Python tests, backend HTTP tests, Playwright suites, `load/recommendations.js`; CI cho SHA `cf16e0b` thành công ở lượt kiểm tra trước. **Missing:** Hybrid v2 tests/CI artifacts và quyền public. **Unverified:** mọi kết quả v2 vì v2 chưa triển khai.

**Inputs:** v2 candidate/run/UI, isolated DB/Compose, rights record, Phase 01 baseline. **Outputs:** system test matrix, actual metrics/resource logs, release decision, rollback rehearsal. **Files to modify if required:** existing test/CI/load configs; proposed `docs/recommendation/hybrid/reports/phase_07_report.md` và `system_test_report.md` (chưa tạo).

1. **P0** Chạy Python unit/golden/reproducibility, backend unit+HTTP, frontend lint/typecheck/build/Playwright; ghi command, exit code, SHA, DB, pass/fail và fixtures vs real H&M.
2. **P0** Commerce regression Catalog/Cart/Checkout/COD failure/Order/Inventory ở isolated environment; Recommendation outage không làm thay commerce state.
3. **P0** k6 PDP mixed Product contexts high/low coverage, cold/warm, 30 RPS/60s baseline; tăng tải chỉ khi baseline ổn. Báo p50/p95/p99 successful-only và all, error/capacity/dropped, throughput, CPU/RAM/VRAM, PG connections/query time, disk, per-request cost estimate. So 1 vs multiple replicas nếu môi trường đủ.
4. **P0** Fault test candidate store/Redis/worker trên disposable stack; rollback active version, flag OFF, restart. Không fault DB dùng chung.
5. **P0** Review logs/API/Git cho raw dataset, IDs, secrets, license và image origin. Human relevance claim chỉ với hai reviewer thật; public rights ghi chủ sở hữu quyết định.
6. **P1** Ghi CI run URL và test artifacts của đúng SHA; không dùng run cũ làm v2 evidence.

**Acceptance:** Given v2 enabled ở isolated stack, when chạy full matrix, then mọi P0 PASS và không regression commerce. Given load target 30RPS, then error <1%, dropped 0, p95 success-only < mục tiêu đã chốt sau baseline; báo FAIL nếu không đạt. Given rights chưa rõ, then public NO-GO. **Gate:** PRIVATE GO chỉ khi P0, quality, NFR và rights-private pass; PUBLIC GO cần rights/model/hosting riêng. `NOT_RUN` không tính PASS. **Risk/fallback:** PDP hiện có lỗi tải cao lịch sử → giữ metadata active/flag OFF và profile bottleneck; không hạ threshold để tạo PASS. **Rollback:** ready version cũ + flag, không xóa commerce data. **Core commerce:** phải độc lập. **Next:** 08 chỉ nếu được giao riêng. Báo cáo: `reports/phase_07_report.md` và `reports/system_test_report.md` (proposed).
