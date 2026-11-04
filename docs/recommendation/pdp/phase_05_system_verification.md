# Phase 05 — System test, performance & resilience cho PDP

> **ID:** REC-PDP-P05 · **Phụ thuộc:** P04 PASS · **Ưu tiên:** P0
> **Spec:** `PDP-T01..12`, `PDP-NFR-01..04` trong [spec.md](spec.md).
> **Reports:** `docs/recommendation/pdp/reports/phase_05_report.md` và `system_test_report.md`.

## 1. Mô tả đơn giản

Kiểm tra cả đường đi từ **H&M candidate → PostgreSQL → Recommendation API → Product Detail**; sau đó cố tình tạo tình huống thiếu dữ liệu/lỗi và đo xem trang có nhanh, đúng, không ảnh hưởng đặt hàng hay không.

## 2. Đầu vào

- 00–04 đã đạt technical gates; bản build/commit đã khóa.
- Test database/Redis/Caddy hoặc môi trường local test được cô lập, fixture publishable key và region.
- `docs/recommendation/runbook.md`, `load/recommendations.js`, `apps/storefront/e2e/recommendations.spec.ts`.

## 3. Test plan chi tiết

1. **Offline:** rerun Python tests, deterministic hashes, validation input metadata/candidate format và IDs.
2. **Backend:** Jest/unit, Medusa HTTP tests trên DB ephemeral, migration/publish/rollback, wrong region/channel/price, stale/draft/stock/backorder.
3. **PDP browser:** 3 loại context (H&M có 6, H&M ít hơn 6, non-H&M), flag ON/OFF, API OFF/503, broken image, responsive/keyboard.
4. **Commerce regression:** Auth, catalog/PDP, add cart, checkout COD, payment simulator failure, order/history/inventory. Không làm recommendation thành dependency của checkout.
5. **Fault injection test cô lập:** stop Redis (fallback), candidate store error/active pointer invalid, backend stop/timeout. **Không stop production DB**; mọi lỗi phải trả thông điệp hợp lệ và PDP vẫn render nếu Medusa core còn hoạt động.
6. **PDP-specific k6:** 30 RPS/60s, tối thiểu nhiều product contexts (không chỉ một hot home key). Tách 3 profile: H&M context có candidates, context ít candidates và unknown/no candidate. Đo p50/p95/p99, error rate, dropped iterations.
7. **Resources:** CPU/RAM, PG connections, DB query/batch count, Redis status, test dataset size, number of API replicas; ghi mọi điều kiện để reproduce.
8. **Production config safety:** features OFF ở config public, ngưỡng concurrency/timeout, không expose test publishable key/DB passwords.
9. **Re-run after fixes:** giữ log lỗi đầu tiên, sửa bug và chạy lại toàn bộ affected + core regression; không xóa assertions/giảm threshold để tạo pass.

## 4. NFR mục tiêu để đánh giá, không phải số đã đo

| Metric | Mục tiêu ban đầu | Ghi chú |
|---|---|---|
| Workload | 30 RPS / 60s | PDP diverse contexts, cùng test environment |
| Response p95 | <800 ms | Mục tiêu thử nghiệm; cần đo và phê duyệt |
| HTTP failures | <1% | Phải ghi cả 4xx fixture/safe fallback assumptions |
| Dropped iterations | 0 | Nếu không đạt, report minh bạch |
| Returned products | 0–6, unique, correct price/channel | Data correctness quan trọng hơn latency |
| DB resource | Không gặp SQLSTATE 53300 ở workload đã chốt | Máy local từng bị PG connection exhaustion |

**Không dùng số Home p95 166.22ms** từ `load-verification.json` để kết luận PDP đạt mục tiêu. Cũng không claim 100k catalog, 150RPS, long-endurance hoặc public SLO nếu không chạy.

## 5. Tệp code/test dự kiến

- Sửa/giữ `load/recommendations.js` để hỗ trợ `placement=product_detail`, list Product IDs từ fixture private.
- Bổ sung Playwright PDP cases và Medusa HTTP negative/fault tests nếu thiếu.
- Store raw k6 JSON/log ở `data/hm/processed/` (ignored), summary đã scrub trong `docs/recommendation/pdp/reports/`.

## 6. Output

- `reports/phase_05_report.md`: các lệnh thực chạy, exit codes, environment, failures/fixes.
- `reports/system_test_report.md`: test matrix PASS/FAIL/BLOCKED/NOT_RUN, benchmark chi tiết và limits; dẫn đường tới artifacts.

## 7. Exit gate

**PASS private technical** khi offline/backend/PDP/regression pass trên target commit và có kết quả PDP load minh bạch. Nếu không có môi trường benchmark thì ghi `NOT_RUN` và **không claim NFR PASS**. Nếu performance không đạt, ghi `NOT MET` và biện pháp tối ưu/chấp nhận rủi ro có owner.

## 8. Safety/rollback

Test destructive (migration-down, stop DB, 30RPS checkout) chỉ được chạy trên DB/stack do test sở hữu. Không xóa volumes commerce, không chạy destructive trên cloud production; flags OFF/active ready-run rollback nếu lỗi.
