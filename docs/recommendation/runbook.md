# Chạy Recommendation MVP trong môi trường private

MVP đã có Popular Products ở Home và Similar Products ở PDP. Medusa vẫn quyết định sản phẩm được bán, giá theo region/channel, inventory/backorder và checkout. Giao dịch H&M chỉ tạo điểm xếp hạng offline; không tạo Orders. Không có cá nhân hóa theo customer, LLM hoặc training trong HTTP request.

## Trước khi chạy

- Dùng npm theo `packageManager` trong root package.json; Python 3.10+ chỉ cần standard library.
- Có Docker, image `commerce-backend:local` (có thể build bằng `docker compose build backend`).
- `data/hm/` có CSV được tải hợp lệ; catalog/mapping gốc đã được đối soát theo Phase 01. Xem [báo cáo](reports/phase_01_report.md).
- Stack test mặc định dùng network `e-commerce_default` đang có tại workspace này. Có thể tạo một network riêng rồi đặt `RECOMMENDATION_COMMERCE_NETWORK` để không phụ thuộc network đó.
- Public release vẫn NO-GO khi chưa xác minh quyền H&M. Không commit CSV, ảnh, context key, DB dump hoặc artifacts.

## Bootstrap stack test

Chạy từ root. Các lệnh chỉ tạo/migrate DB riêng `recommendation_test`; không reset DB commerce.

```powershell
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml up -d recommendation-test-postgres recommendation-test-redis
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml run --rm --no-deps recommendation-api node /app/node_modules/@medusajs/cli/cli.js db:migrate --execute-safe-links
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml up -d recommendation-api recommendation-proxy
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-recommendation-test.ts
docker cp recommendation-test-recommendation-api-1:/tmp/recommendation-test-context.json data/hm/processed/recommendation-test-context.json
```

Fixture seed chỉ được phép chạy trên test DB được định danh rõ. Nó tạo ba sản phẩm commerce mẫu và publish fixture nếu chưa có active run; không thay một H&M run đang active. Publishable key trong file context là key test, giữ ngoài Git.

## Dùng catalog H&M thật trên test DB

```powershell
New-Item -ItemType Directory -Force data/hm/test-serving/processed | Out-Null
Copy-Item data/hm/processed/catalog.jsonl data/hm/test-serving/processed/catalog.jsonl
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/import-hm-catalog.ts
python scripts/hm/profile-interactions.py
python scripts/hm/build-mvp-candidates.py --version rec-private-pilot-v2 --min-score 0.7
python scripts/hm/remap-candidates.py --version rec-private-serving-v2
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/publish-hm-recommendations.ts
```

Remapper đòi hỏi cùng article universe, không tách/gộp product khác source. Nó đổi cả target IDs và context IDs; không ghép hai catalog không liên quan. Mapping test được lưu riêng, mapping commerce gốc không bị ghi đè. Một version đã ready là immutable: đổi dữ liệu/config phải dùng version mới. Failed/staging run không được activate lại bằng cách bỏ qua kiểm tra; tạo bản sửa mới.

## Storefront private preview

```powershell
$recContext = Get-Content -Raw data/hm/processed/recommendation-test-context.json | ConvertFrom-Json
$env:NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = $recContext.publishable_key
$env:MEDUSA_BACKEND_URL = 'http://127.0.0.1:9004'
$env:NEXT_PUBLIC_MEDUSA_BACKEND_URL = 'http://127.0.0.1:9004'
$env:NEXT_PUBLIC_ENABLE_RECOMMENDATIONS = 'true'
$env:MEDUSA_SDK_DEBUG = 'false'
Set-Location apps/storefront
npm exec -- next dev -p 8001
```

Mở `http://localhost:8001/vn`. API trực tiếp ở 9002; Caddy test ở 9004 có timeout cho cả middleware chạy trước route. Trên production build, `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS` là build-time flag, phải rebuild khi thay đổi. Cả backend và frontend mặc định OFF trong cấu hình triển khai chính.

## Kiểm thử

```powershell
python -m unittest discover -s scripts/hm/tests -v
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/scripts/hm/run-backend-tests.mjs unit
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/scripts/hm/run-backend-tests.mjs integration:http
```

Runner Linux dùng DB ngẫu nhiên do Medusa test-utils tạo và thu dọn. TCP proxy local bên trong runner xử lý giả định SSL/hostname của test-utils 2.21.2; không sửa Medusa core. Migration down/up chỉ được thực hiện sau khi test xác nhận đúng tên DB tạm; không chạy trên `commerce` hoặc `recommendation_test` đang giữ demo.

Trong `apps/storefront`, đặt `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8001`, `RECOMMENDATIONS_EXPECT_ENABLED=true`, rồi chạy `npm exec -- playwright test`. Đặt expected flag `false` cho bản build frontend OFF hoặc API OFF; assertions kiểm tra behavior tương ứng, không bỏ test.

## Tải, lỗi và rollback

- `load/recommendations.js`: 30 RPS/60 giây mặc định, đo p50/p95/p99, lỗi và dropped iterations. Đọc context test qua mount; không đưa key vào source/lệnh in log.
- Chạy một replica: `docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml --profile load run --rm recommendation-k6`.
- Test ba replicas: bật profile `scale`, gọi proxy 9005; đặt `BASE_URL=http://recommendation-scale-proxy:9005` cho k6. Đây là test local, không phải cloud deployment đã hoàn thành.
- API mặc định giới hạn 4 requests đang xử lý/replica; stack test đặt 8. Quá tải trả 503 + Retry-After. Deadline route 4 giây; Caddy có header timeout 5 giây cho trường hợp mắc ở middleware Medusa.
- Gộp validation trùng ngữ cảnh chỉ trong lúc đang chạy, không giữ kết quả hoàn tất; khác key/region/locale tách riêng. Request có cookie/token/identity không dùng coalescing.
- Candidate store ở PostgreSQL; Redis chỉ dùng qua các modules Medusa đã cấu hình. Không có custom candidate cache hay TTL tự phát minh. Redis down đã thử, API vẫn đọc/validate được bằng DB.
- Rollback: đặt `RECOMMENDATION_ACTIVATE_VERSION` thành một ready version rồi chạy publisher. Dùng biến môi trường này; CLI yargs có thể nuốt cờ tùy ý trong `medusa exec`.
- Tắt UI/API bằng flags; không xóa catalog/Orders/DB/volumes. Không dùng `down -v`, reset DB hoặc force push.

## Source và giới hạn

PDP-specific verification, production builds ON/OFF và benchmark đa product contexts: xem [PDP runbook](pdp/runbook.md) và [system report](pdp/reports/system_test_report.md). Với `medusa start`, build backend sau khi sửa source rồi restart API test trước khi đo; không restart khi HTTP suite đang chạy. Benchmark Home ở báo cáo cũ không chứng minh throughput PDP; mục tiêu PDP30RPS hiện chưa đạt.

- [Module](../../apps/backend/src/modules/recommendation/index.ts), [publish workflow](../../apps/backend/src/workflows/recommendation/publish.ts), [Store API](../../apps/backend/src/api/store/recommendations/route.ts).
- [Medusa adapter](../../apps/backend/src/modules/recommendation/store-products.ts) phụ thuộc exports/middleware của đúng Medusa 2.21.2; khi upgrade phải chạy lại tests. Không tự xây giá hoặc công thức inventory.
- [Offline generator](../../scripts/hm/build-mvp-candidates.py), [ID remapper](../../scripts/hm/remap-candidates.py), [Next adapter](../../apps/storefront/src/lib/data/recommendations.ts).
- Threshold 0.70 được chọn bằng agent metadata spot-check; không thay thế human relevance study. Không có dữ liệu click/impression hoặc kết luận CTR/conversion.
- Tập 500 products theo thứ tự khóa có bias; số đo không đại diện toàn bộ H&M. Không có ảnh H&M; dùng placeholder có sẵn.
- Không có HA/Multi-AZ, automated retraining, distributed rate limiting hoặc A/B testing. Những phần này không được đánh dấu đã triển khai.
