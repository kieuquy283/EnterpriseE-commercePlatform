# PDP verification — bổ sung private runbook

Đây là hướng dẫn test chuyên biệt PDP, bổ sung [runbook nền](../runbook.md), không thay commerce bootstrap. Không public H&M data/ảnh/candidates. Master plan/spec tổng thể không bị sửa.

## Offline audit

```powershell
python -m unittest discover -s scripts/hm/tests -v
python scripts/hm/verify-pdp-candidates.py --output data/hm/processed/pdp-verification/run-a
python scripts/hm/verify-pdp-candidates.py --output data/hm/processed/pdp-verification/run-b
```

Validator chỉ đọc articles/catalog/mapping/existing candidates và sinh artifacts riêng; không đọc customers/transactions, không gọi DB. DB readback vẫn phải chạy `check-hm-mapping.ts` qua Medusa như runbook nền. Không dùng mapping commerce ở DB test khác. Giữ snapshot `pdp-v3` hiện có nguyên trạng; dùng version mới khi đổi input/config và giữ Home rankings khi tạo full-run snapshot, vì publisher hiện yêu cầu cả Home/PDP. Không tự đổi ready manifest hoặc ghi vào core tables.

## Backend build trước đo

```powershell
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api npm run build
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml restart recommendation-api
node scripts/hm/probe-pdp.mjs
```

Source mount không đồng nghĩa `medusa start` đã nạp TypeScript mới: phải build rồi restart. Không restart API chứa tiến trình HTTP test đang chạy. Chạy tests/benchmark tuần tự để tránh nhiễu tài nguyên.

## Production frontend ON/OFF cô lập

Khởi động local fault harness tại root, giữ terminal/session chạy:

```powershell
node scripts/hm/pdp-test-proxy.mjs
```

Từ root, đọc key private vào env; không in key:

```powershell
$pdpContext = Get-Content -Raw data/hm/processed/recommendation-test-context.json | ConvertFrom-Json
$env:NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = $pdpContext.publishable_key
$env:MEDUSA_BACKEND_URL = 'http://127.0.0.1:9006'
$env:NEXT_PUBLIC_MEDUSA_BACKEND_URL = 'http://127.0.0.1:9006'
$env:MEDUSA_SDK_DEBUG = 'false'
$env:NEXT_BUILD_DIR = '.next-pdp-on'
$env:NEXT_PUBLIC_ENABLE_RECOMMENDATIONS = 'true'
Set-Location apps/storefront
npm run build
npm exec -- next start -p 8003
```

OFF build dùng `.next-pdp-off`,flagfalse vàport8004 trong terminal riêng. Hai build output đều ignored; không đè `.next` dev preview. Next tự cập nhật next-env.d.ts/tsconfig khi custom output; kiểm diff và chỉ khôi phục những thay đổi generated của task sau khi test. Không xóa output hoặc local work của người khác.

Chạy browser từ storefront:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:8003'
$env:PDP_FAULT_TESTS = 'true'
$env:RECOMMENDATIONS_EXPECT_ENABLED = 'true'
npm exec -- playwright test --reporter=list
```

Fault cases cần file private `data/hm/processed/pdp-verification/browser-contexts.json` gồm objects `{handle,id,profile}` với3 contexts full/sparse/zero đã được xác minh từ candidate counts và Store API, không hardcode source IDs vào Git. Proxy mode mặc định normal; afterEach restore normal. Harness không dùng ở deployment chính. Với OFF server đặt base8004, `PDP_FAULT_TESTS=false`, `PDP_EXPECT_FRONTEND_OFF=true` và chạy file `e2e/pdp-similar-products.spec.ts`.

## PDP benchmark

File private `data/hm/processed/k6/pdp-contexts.json` là array30 valid Product IDs:10 full/10 sparse/10 zero, lấy từ mapping và candidate counts. Phải validate targets trước khi đo. Existing Compose mount results làm `/results`; không đưa key/IDs vào source.

```powershell
docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml --profile load run --rm -e PLACEMENT=product_detail -e PRODUCT_CONTEXTS=/results/pdp-contexts.json recommendation-k6 run --quiet --summary-export=/results/pdp-rerun-summary.json /scripts/recommendations.js
```

3 replicas: thêm overlay `-f deploy/docker-compose.pdp-scale-test.yml --profile scale up -d recommendation-api-2 recommendation-api-3 recommendation-scale-proxy`, chờ **cả2 API build/ready**, sau đó k6 env `BASE_URL=http://recommendation-scale-proxy:9005`. Overlay bảo đảm replicas mới build cùng mounted source. Dừng replicas bổ sung sau benchmark, không `down -v`.

Mục tiêu30RPS **chưa đạt** trên máy đã đo. Không dùng rail này để khẳng định hệ thống chịu30RPS PDP thành công. Trước scale/public phải profile và xử lý capacity bottleneck. Xem [system report](reports/system_test_report.md).

## Rollback, faults và quyền

Activate ready version bằng `RECOMMENDATION_ACTIVATE_VERSION` và publisher theo runbook nền; probe phải xác nhận version mong muốn. Phiên này đã thử `rec-private-serving-v2` rồi restore `pdp-private-v3`. OFF frontend cần rebuild; backend OFF404 được client degrade. Không đổi giá/tồn kho/Orders để rollback Recommendation.

Fault Redis/PG chỉ stack test được nhận diện, luôn restart trong finally. PG outage được Caddy trả504 sau khoảng5s; không mong core checkout thành công khi PG down. Human relevance và public data rights chưa có; single-user private technical demo chỉ có thể dùng với các giới hạn đã báo cáo.
