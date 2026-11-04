# Phase 05 — Full System Verification & PDP Performance

Chốt ngày 04/11/2026, Asia/Saigon; thời điểm cụ thể theo system report. Baseline `6f3c8d9` + diff, branch bàn giao `recommendation-pdp`. Windows/Node24.15.0/Python3.10.11, Medusa2.21.2, PostgreSQL16.15. Serving DB `recommendation_test`; integration DB ephemeral do runner sở hữu. Docker engine8CPU/7.631GiB; cùng host có các container commerce khác nhưng không gửi load vào chúng.

## Verification

Chi tiết command/expected/actual/exit và evidence: [System report](system_test_report.md), [source evidence](../evidence/source-verification.json), [offline evidence](../evidence/offline-verification.json), [load evidence](../evidence/pdp-load-verification.json).

Python9, backend unit32, HTTP4/3 suites, production browser18ON+1OFF đạt PASS. Lint/typecheck/build đã chạy;18 lint warnings có sẵn. API privacy, ranking, limit, status/region/channel/price, stock/backorder, publisher partial fault/immutability, migration down/up guard đều có tests. Không coi unit fake là HTTP/native Medusa evidence.

PDP load **không đạt target30RPS** sau các tối ưu nhỏ. Không hạ ngưỡng0.70, không sửa benchmark SLO800ms/error1%/dropped0 để báo PASS. Một replica bị capacity rejection; ba replicas giảm lỗi nhưng p95 xấu hơn và dropped>0. Giữ các run fail; không gộp chúng với Home benchmark. Xem load evidence cho run cuối riêng và số liệu chính xác.

## Faults và recovery thực chạy

- `docker compose … stop recommendation-test-redis` → `node scripts/hm/probe-pdp.mjs`: exit0,HTTP200/6 products/105ms; `start recommendation-test-redis` trong finally. Đây là failure/bypass, không phải pure cold-cache benchmark.
- `docker compose … stop recommendation-test-postgres` → `PDP_PROBE_EXPECT_STATUS=504 node scripts/hm/probe-pdp.mjs`: exit0,HTTP504/5057ms qua Caddy; start PG trong finally. Không xóa volume/dữ liệu. Không claim checkout hoạt động khi commerce DB down.
- Re-publish v3 exit0; activate ready v2 exit0/probe200 versionv2; restorev3 exit0/probe200 versionv3. Không reset/reseed demo DB.
- Additional test replicas đã stop sau đo tải; API chính/PG/Redis được giữ hoạt động.

## Verdict

**PARTIAL — correctness/regression PASS, PDP load target NOT MET.** Phase06 được phép tổng kết outcome NOT_MET theo tài liệu phase06; không biến toàn bộ system thành PASS. Public rights/human review NOT_RUN. Không đo100k,150/300RPS, cloudHA, long endurance, full SQL profiling hoặc production SLA. Resource samples chỉ point-in-time, không peak/continuous monitoring.

Next performance work: profile native Medusa hydration/pricing/inventory CPU và batch SQL trên workload này, kiểm overhead querygraph/middleware, lập regression benchmark trước tối ưu sâu; không thay commerce validity bằng snapshot giá/tồn kho cũ. Rollback active version/flags như Phase03; target chưa đạt được đưa vào release gap, không che lỗi.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
