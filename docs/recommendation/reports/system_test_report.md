# System Test Report — Recommendation MVP

**Verdict: SYSTEM PASS cho private pilot theo contract1.1; PUBLIC NO-GO.**

Baseline: recommendation / de9b437f613d9cff300428f5e6e6161ed441ad62 + source chưa commit. Thực hiện ngày2026-11-04, Asia/Saigon. Windows Node24.15/npm11.12.1/Python3.10.11; backend tests/build dùng Linux Node22.22.0, Medusa2.21.2, PostgreSQL16 test riêng. Không chạy faults/load trên DB commerce gốc.

## Kết quả kiểm thử

| Nhóm | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| Python fixtures | Mapping/ranking/split/missing/repeat/remap đúng |7 passed,0 failed,0 skipped |PASS |
| Backend unit | Schema/privacy/stock/backorder/coalescing đúng |30 passed,0 failed,0 skipped |PASS |
| Backend HTTP | Medusa thật,publish/filter/failures/core commerce |3 suites/4 tests passed |PASS |
| Browser full suite | Catalog,variants,auth,cart,COD,orders,mobile,rails |11 passed; ban đầu3 lỗi tests đã sửa |PASS |
| Frontend OFF | Không gọi/hiện rail mới; PDP hoạt động |Production flag-OFF browser case passed |PASS |
| API OFF/UI ON | Recommendation lỗi không chặn PDP |Browser case passed |PASS |
| Real Redis guards | Draft/zero-stock target bị loại |CLI QA passed,fixture khôi phục trong finally |PASS |
| Migration | Down/up chỉ trên DB runner sở hữu |DB-name guard + roundtrip + empty module check passed |PASS |
| Re-import/re-publish/rollback | Không duplicate/partial active |0 products created khi re-import500;3298 candidates ổn định;ready pointer rollback/restore |PASS |
| Typecheck | Backend/storefront source hợp lệ |Cả hai exit0 |PASS |
| Lint | Không lỗi mới/không tắt rule |Backend0 issues;storefront0 errors/18 warnings có sẵn |PASS with existing warnings |
| Build | Backend + Next production build |Cả hai exit0;backend admin-disabled trong test config |PASS scoped |
| YAML/config | Cấu hình Compose/CI parse được |Compose main/test config exit0;CI definitions chưa có remote run |PASS local only |

Các tests bao gồm stock0,backorder,missing price/wrong currency,unpublished,wrong channel,invalid region/limit/customer query,self-exclusion,score/metadata projection,duplicate/partial publish,active restore và lỗi dependency. Native product-batch telemetry được dùng để kiểm tra số batch thay vì một request cho mỗi product; không coi đây là SQL statement profiling của toàn bộ Medusa internals.

## Xác nhận cuối

Chốt báo cáo lúc 11:42:48 ngày 04/11/2026 (Asia/Saigon). Lần chạy cuối `npm exec -- playwright test --reporter=list` đạt **11/11 trong 1.9 phút**, gồm account/order history, cart, catalog, COD success/failure, recommendation và mobile. Lỗi race khi thêm giỏ được sửa bằng cách chờ Server Action hoàn tất và số lượng giỏ cập nhật; không bỏ assertion. Chạy lại toàn bộ suite sau sửa, không chạy đồng thời với HTTP integration tests. CI YAML parse và `git diff --check` đạt PASS. [Bản ghi tổng hợp](../evidence/system-verification.json).

## Dữ liệu thật đã xác minh

105542 articles và31788324 transactions được profile theo luồng. Pilot500 products/1874 articles giữ979342 giao dịch;500/500 có history. Target test import500 H&M products bên cạnh3 fixture products;mapping1874 variant/product/SKU được đọc lại bằng Medusa services. Hai lần sinh v2 có cùng candidate bytes. Phiên bản serving hiện có100 Home +3198 PDP rows.

Temporal evaluation: train<=2020-09-08,validation09-09..15,test09-16..22. Purchase-event micro recall@12 tại cấp Medusa Product: test0.4294747082 so với catalog-order0.0325875486,4112 events. Không phải customer/article MAP@12,CTR,conversion hoặc đánh giá production availability theo thời gian. Catalog tĩnh/lexicographic có bias và không có publication timestamps.

## Tải và lỗi

| Workload30RPS/60s | p50 ms | p95 ms | p99 ms | Error | Dropped |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home,1 API,Redis ready |90.91|166.22|253.19|0.333%|0|
| Home,3 API,same code |166.09|321.02|430.67|0%|0|
| Home,1 API,Redis stopped |85.97|159.28|226.71|0.111%|0|

[Số đo và source hashes](../evidence/load-verification.json). Một replica đạt mục tiêu warm250ms;ba replicas chỉ đạt ceiling800ms,không đạt250ms. Workload là anonymous Home cùng region/key;không suy ra SLO cho random PDP/authenticated/multi-region/100k products. Redis stopped là cache-bypass/failure profile,không phải pure cold-start benchmark.

Đã thử Redis stop→HTTP200/12 products trong0.19s;PostgreSQL stop→Caddy504 trong5.01s,khởi động lại giữ dữ liệu. Direct-port request có thể chờ ở middleware trước handler;Caddy timeout là một phần frontdoor test. Không claim checkout hoạt động khi chính commerce DB down. Publisher staging fault đã thử;không có dedicated Recommendation worker để giả lập worker-process failure—serving chỉ đọc ready candidates và không chạy training.

## Commands/evidence và điều kiện tái chạy

- [Runbook](../runbook.md): commands cho datasets,tests,flags,load,rollback.
- Reports [00](phase_00_report.md),[01](phase_01_report.md),[02](phase_02_report.md),[03](phase_03_report.md),[04](phase_04_report.md),[05](phase_05_report.md),[06](phase_06_report.md),[07](phase_07_report.md).
- Logs lớn/context/raw k6 summaries nằm trong data/hm và bị gitignore;chỉ aggregate đã scrub trong evidence.
- Source mapping/model hashes phải khớp khi tái chạy;đổi scoring/input dùng version mới.
- CI được bổ sung Python/unit/full HTTP,nhưng chưa push/chưa có GitHub run. Không tuyên bố CI xanh từ local tests.

## Những điều chưa được nghiệm thu

Public rights và human relevance review NOT_RUN/NO-GO;không có CTR/conversion study. Long endurance,150/300RPS,100k catalog,cloud HA,remote CI,distributed per-client rate limiting và pure empty-cache p95 chưa được chạy/hoàn thiện. Chúng không được biến thành PASS. Private technical gate thay human gate chỉ theo [ADR](../adr-private-validation.md),không phải chứng nhận chất lượng bằng người thật.

Rollback bằng flags và chọn lại ready run;không reset DB,xóa Orders/volumes hoặc force push.
