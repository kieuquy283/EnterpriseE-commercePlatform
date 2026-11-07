# Phase 03 — Publishing & API

Thời điểm cập nhật: 04/11/2026 13:20 Asia/Saigon. Baseline recommendation / `6f3c8d99cac44d94f296dbe912ed82d820ac6584` + working diff. Windows/Node24.15.0/Python3.10.11; container Medusa2.21.2, PostgreSQL16.15. API serving DB `recommendation_test`; HTTP suites dùng DB `medusa-…-integration-…` riêng, guard trước revert.

## Changes và review

Reuse module/migrations/workflow. Không sửa Medusa core hoặc bảng commerce. Route PDP gộp target + first candidate batch; fallback phân nhóm bằng metadata-only graph rồi validate giá/stock qua native Store Products theo batch tối đa6, chỉ đọc tiếp nếu chưa đủ. Không cache completed price/stock. Giữ rank primary trước fallback; preserve popularity order trong cùng group. Home behavior giữ nguyên. Target chưa bán được vẫn404. Không nới min_score hoặc tăng concurrency để che lỗi tải.

Thêm unit regression cho candidate rank/fallback ordering, candidate-store failure/empty/disabled flag. HTTP thêm PDP param matrix, max6/unique/rank và **zero-stock→404, allow_backorder→200 qua Medusa thật**. Version-coupled adapter2.21.2 không được coi là public stable API.

## Commands/evidence mới

| Command | Exit | Actual |
| --- | --- | --- |
| `docker compose … exec -T recommendation-api node /app/scripts/hm/run-backend-tests.mjs unit` |0|32 tests/3 suites PASS sau gộp batch |
| `docker compose … exec -T recommendation-api npm run lint` |0|No lint issues |
| `docker compose … exec -T recommendation-api npm run typecheck` |0|TypeScript PASS |
| `docker compose … exec -T recommendation-api npm run build` |0|Medusa backend build PASS, Admin disabled trong test |
| `docker compose … exec -T recommendation-api node /app/scripts/hm/run-backend-tests.mjs integration:http --silent` |0|4 tests/3 suites PASS; final log `data/hm/processed/pdp-verification/backend-http-merged-batch.log`,101.009s |
| `docker compose … exec -T -e HM_PROCESSED_DIR=/app/data/hm/processed/pdp-v3 recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/publish-hm-recommendations.ts` |0|3298 candidates publish:100 Home preserved +3198 PDP; version `pdp-private-v3` |

`…` luôn là `-p recommendation-test -f deploy/docker-compose.recommendation-test.yml`. HTTP logs giữ ngoài Git. Lần HTTP đầu bị API restart giữa suite nên exit1: không dùng làm PASS; các lần rerun độc lập sau restart đạt4/4. Benchmark đầu còn dùng compiled runtime cũ; đã phát hiện bằng kiểm `.medusa/server` chứa marker source, build lại rồi restart. Reports performance phải phân biệt các run này.

## Acceptance và giới hạn

| Gate | Expected | Actual |
| --- | --- | --- |
| Immutable/idempotent/fault | Re-publish no duplicate, staging failure giữ active | HTTP integration PASS |
| Privacy/query validation | No raw IDs/metadata/scores, unknown params400 | Unit+HTTP PASS |
| Native commerce | Draft/channel/price/stock/backorder | HTTP PASS trên DB thật; Home và PDP paths dùng cùng native adapter |
| Bound/batch | ≤100/context, ≤6 display, no per-item fetch | Batch telemetry+ordered unit PASS |
| Fallback | No candidates/outage, deterministic valid products | Unit service outage, HTTP invalid pointer, real sparse/zero PDP browser contexts |
| Serving performance | Mixed PDP30RPS | Xem Phase05, không suy Home numbers |

Self-review AGENT_REVIEW; không human quality certification. Rollback bằng activate ready version/flags, không migrate-down DB demo. Private API correctness **PASS**; performance chưa được suy thành PASS từ correctness. DB outage trước Medusa route phụ thuộc proxy timeout, không claim route có thể timeout middleware trước nó.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
