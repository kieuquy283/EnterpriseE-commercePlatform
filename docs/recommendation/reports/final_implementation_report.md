# Báo cáo triển khai H&M Recommendation MVP

**Đã triển khai và kiểm thử cho private pilot. Public release: NO-GO.**

Ngày2026-11-04,Asia/Saigon. Branch recommendation,baseline de9b437f613d9cff300428f5e6e6161ed441ad62;source/tài liệu đang ở working tree,chưa commit/push. [Cách chạy](../runbook.md),[system test](system_test_report.md).

## Trạng thái từng phase

| Phase | Verdict | Báo cáo |
| --- | --- | --- |
|00 Baseline/rights |PASS private;public NO-GO |[00](phase_00_report.md)|
|01 Data readiness |PASS |[01](phase_01_report.md)|
|02 Popularity offline |PASS |[02](phase_02_report.md)|
|03 Similarity offline |PASS private technical;human NOT_RUN |[03](phase_03_report.md)|
|04 Candidate publishing |PASS |[04](phase_04_report.md)|
|05 Serving API |PASS |[05](phase_05_report.md)|
|06 Storefront |PASS |[06](phase_06_report.md)|
|07 Evaluation/release |PASS trong profile private đã đo;public NO-GO |[07](phase_07_report.md)|

## Chức năng bàn giao

- Home có tối đa12 Popular Products từ lịch sử H&M;PDP tối đa6 Similar/You may also like với label phản ánh fallback.
- Python streaming,temporal evaluation,weighted metadata similarity,versioned artifacts và remapping nhất quán tới cùng Medusa catalog.
- Medusa custom module3 models,migration,indexes,publisher batches100,staging/ready/active pointer,idempotency và rollback.
- Store API kiểm input và dùng native Medusa pipeline cho channel,region,price,stock/backorder. Không trả metadata/SKU/article options/scores;không nhận customer_id.
- Coalescing chỉ cho công việc anonymous đang chạy;không giữ completed price/stock. Authenticated pricing context được forward;cookie/token không dùng shared work.
- Next adapter timeout/no-store,ProductPreview/placeholder/Suspense,flag ON/OFF,network fallback. SDK debug opt-in để hạn chế lộ headers.
- Docker test stack độc lập,Redis/Caddy,k6 và cấu hình3 API replicas để đo. CI bổ sung fixture/unit/HTTP tests;chưa có remote run.

## Bằng chứng đã chạy

| Loại | Kết quả |
| --- | --- |
|Python |7 tests passed|
|Backend unit |30 tests passed|
|Backend HTTP |4 tests/3 suites passed,gồm checkout success và payment-simulator failure|
|Playwright full suite |11 passed,gồm auth/cart/COD/order history/mobile/recommendations|
|Flag/error modes |Production UI OFF và API OFF/UI ON đều đã thử|
|Lint/typecheck/build |Exit0;còn18 lint warnings storefront có sẵn;backend build test bỏ Admin bundle|
|Data import/re-import |500 H&M Products/1874 variants;re-import0 created/500 existing|
|Publish/rollback |3298 rows;re-publish không nhân đôi;staging fault giữ old active;rollback/restore ready run|
|Mapping |1874 article→variant/product/SKU readback đúng|
|Faults |Redis down vẫn phục vụ;DB down frontdoor504 trong5.01s;khôi phục không reset dữ liệu|

Số đo Home30RPS/60s trên Docker8CPU/7.631GiB,500 H&M products:1 API p95 **166.22ms**,error **0.333%**,0 dropped iterations. Redis unavailable:159.28ms/0.111%/0 dropped.3 API:321.02ms/0%/0 dropped;không tốt hơn1 API về latency trong workload này. [Evidence](../evidence/load-verification.json). Đây không phải chứng minh300RPS hay100k catalog.

## Chất lượng thuật toán và giới hạn

Popularity test purchase-event micro recall@12=0.4294747082 so với catalog-order0.0325875486,trên4112 held-out events. Không phải customer MAP@12 hoặc CTR/conversion. V2 candidates deterministic qua2 lần chạy thật:100 Home +3198 PDP;167/500 contexts có>=6 Similar.

Agent xem20 contexts/20 product types,66 neighbors cùng type;Exact Category baseline có độ phủ6-neighbor8/20 so với weighted7/20. Đây là diagnostic,không chứng minh weighted tốt hơn. Ngưỡng0.70 là lựa chọn private qua metadata;human/visual relevance chưa được đánh giá. Tập500 chọn lexicographic có bias;không có ảnh H&M hoặc lịch sử publication/stock thật.

## Scope/safety và phần chưa làm

Không nhập transactions thành Orders,không gắn khách H&M với customer thật,không thay commerce/payment core. Các orders/accounts dùng khi E2E là synthetic và nằm trong test DB riêng. DB commerce gốc được giữ lại;không xóa volumes/Git history/secrets.

Private gate thay đổi rõ trong [ADR](../adr-private-validation.md) để tiếp tục triển khai tự chủ;artifacts vẫn ghi human NOT_REVIEWED. Public quyền dữ liệu/ảnh chưa xác nhận,nên không public deployment. Không có cloud HA,autonomous retraining,personalization,CTR study hoặc load150/300RPS;không đánh dấu chúng đã xong. SQL internals của Medusa không được suy từ application batch counts. Trước khi mở rộng catalog phải profile lại,cân nhắc giới hạn100000 candidate rows/run và chi phí native pricing.

## Xác nhận cuối

Chốt báo cáo lúc 11:42:48 ngày 04/11/2026 (Asia/Saigon). Full Storefront E2E chạy lại sau sửa đồng bộ thao tác thêm giỏ: **11/11 PASS trong 1.9 phút**. CI YAML parse và `git diff --check` PASS; chưa có remote CI run. [Evidence tổng hợp](../evidence/system-verification.json).

## Vận hành và rollback

Mở private storefront ở http://127.0.0.1:8001/vn khi preview được khởi chạy theo runbook;API9002/frontdoor9004. Cấu hình triển khai chính mặc định OFF;production frontend đổi NEXT_PUBLIC flag cần rebuild.

Đổi ready run bằng RECOMMENDATION_ACTIVATE_VERSION rồi chạy publisher. Nếu lỗi sau mất ACK,kiểm tra pointer trước khi retry. Không xóa sản phẩm/đơn/DB để rollback. Giữ CSV/artifacts/context/logs trong data/hm bị gitignore và Docker ignore.
