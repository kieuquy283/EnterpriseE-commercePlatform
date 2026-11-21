# OPS-06/07 — kiểm chứng local và kiểm kê chỉ đọc, 19/11/2026

## Phiên bản và ranh giới

Baseline `13a9d25673ddd6f2c96889a2760e13b4c6bf093d`, working tree có thay đổi OPS và thay đổi Staff do parent sở hữu. [Manifest](evidence/ops-observability-2026-11-19/manifest.json) ghi lock hash, dirty paths, công cụ/lệnh và giới hạn. Ngày báo cáo theo phiên Việt Nam 19/11; máy báo UTC 18/11, nên inventory/log dùng đúng UTC thực (`17:23Z` và `17:28Z`), không suy lease đã hết từ ngày của session. Không commit/push/PR/workflow edit/cloud mutation, không gửi SNS, không đọc giá trị secret. Preview AWS giữ nguyên lease `2026-11-18T20:48Z`.

## Thay đổi đã kiểm

- Middleware `requestObservability` do parent mount đầu tiên `/*`; ID bounded, request UUID mới, operation ID qua retry, route template làm sạch và allowlist fields. Không dùng nhãn client làm quyền/idempotency.
- Join key order được hash dùng chung với subscriber personalization hiện có; giữ feature gates và ném lại lỗi, không tạo notification consumer/tracing service.
- Logger dùng `logger.log(level, event, entry)` của Medusa. Test process production thật xác nhận event/duration/status/release ở top level; [stdout thật](evidence/ops-observability-2026-11-19/production-logger.jsonl). Cách ban đầu `info(JSON.stringify(entry))` tạo escaped message, đã sửa trước nghiệm thu. CloudWatch query/filter trong [hợp đồng](../technical/observability.md) dùng schema mới; chưa apply metric filter hoặc chứng minh ingestion cloud.
- IaC nguồn thêm `ReleaseSha` mặc định `unversioned`, 1–64 ký tự allowlist, inject API/worker; dashboard thêm worker/storefront/RDS. Default không là provenance; release phải truyền SHA đúng digest. Không apply.
- K6 kiểm mix/list/detail/search, đúng contract, checks/dropped, complete và intent latency riêng, retry cùng order, cart/order totals/line reconciliation và authoritative stock readback. Bảo vệ chỉ loopback; không load AWS.

## Kết quả thực thi

| Lệnh/kiểm | Kết quả và giới hạn |
| --- | --- |
| Backend unit | 17 suites, 155 PASS; gồm HTTP listener thực cô lập và process logger production, không chỉ mock schema |
| Typecheck/lint/build backend | PASS; lint không warning; build cả backend và Admin frontend thành công. Có thay đổi Staff đồng thời trong working tree |
| Selected HTTP cuối, npm 11.12.1 | 2 suites, 5 PASS trong 41,483s: checkout success/failure và 3 k6 baseline/fault/recovery/invalid-key assertions |
| IaC unit | 27 PASS trong venv PyYAML riêng; JSON dashboard và ReleaseSha env/ref structure cũng hợp lệ. Không CloudFormation apply |
| Actual application log | 60 request terminal records, 2 order-event completed records, 1 business-operation join request→subscriber; mọi record có release marker `13a9d25-dirty`. [JSONL](evidence/ops-observability-2026-11-19/application-events.jsonl), [assertions](evidence/ops-observability-2026-11-19/log-verification.json) |
| DB fault | Pause riêng container PostgreSQL mới do phiên này tạo; catalog setup timeout 5s, HTTP status 0, k6 nonzero; unpause trong finally, recovery mix PASS. Không gửi checkout ghi trong outage; không chứng minh rollback/idempotency khi DB mất giữa ghi |
| Invalid publishable key | K6 setup HTTP 400 và exit nonzero; không có workload giả thành công |

Node 24.22.1 đúng pin. PATH npm ban đầu là 11.19.1; unit/lint/typecheck/build ban đầu dùng phiên bản đó, không cài dependency/đổi lock. Unit/lint/typecheck/build được chạy lại với npm 11.12.1 và vẫn PASS; lần HTTP cuối cũng dùng `npm exec --package=npm@11.12.1` transient. Không sửa package/lock.

[Attempt 4](evidence/ops-observability-2026-11-19/attempt-4/server-reconciliation.json) là lượt cuối với logger mới và middleware parent đã mount: một COD order, một dòng quantity=1, cùng order khi retry; tồn available 25→24, không âm. [Catalog baseline](evidence/ops-observability-2026-11-19/attempt-4/catalog-baseline.txt), [checkout baseline](evidence/ops-observability-2026-11-19/attempt-4/checkout-baseline.txt), [DB fault](evidence/ops-observability-2026-11-19/attempt-4/catalog-database-fault.txt), [recovery](evidence/ops-observability-2026-11-19/attempt-4/catalog-recovery.txt), [invalid key](evidence/ops-observability-2026-11-19/attempt-4/catalog-negative.txt) giữ raw k6 summary/thresholds. [Summary máy đọc](evidence/ops-observability-2026-11-19/workload-summary.json): catalog steady p95 66,49ms, complete request 423,93ms, toàn intent 2587ms, recovery catalog p95 53,13ms; checks 100%, dropped=0 ở các lượt thành công. Chỉ 10 catalog iterations và một checkout intent; số đo smoke không xác lập capacity/SLO/production p95. Không dùng zero-valued metric của lượt setup fail làm số đo latency đạt.

Lần HTTP đầu timeout vì cấu hình test runner; lần sau explicit host `127.0.0.1` làm test-utils bật TLS. Dùng `localhost` cho DB disposable sửa đúng hợp đồng test-utils, không đổi mã framework. Attempt 1 k6 qua thresholds nhưng assertion server quantity so BigNumber với number thất bại; sửa ép Number và rerun attempt 2/3/4 có thư mục riêng. Python hệ thống thiếu PyYAML; venv riêng chạy đủ 27 tests. Không gọi các lần đó PASS. Không có waiver/disabled lint hoặc framework modification.

## Kiểm kê AWS read-only

[Inventory có timestamp](evidence/ops-observability-2026-11-19/inventory.json): API/worker/storefront desired/running 1; task CPU/RAM lần lượt 1/2 GiB, 0,5/2 GiB, 0,5/1 GiB; digests trùng preview 18/11. RDS db.t4g.micro available, 20 GiB encrypted, retention một ngày, latest-restorable có giá trị. Redis t4g.micro running; legacy m7i-flex.large stopped. EBS retained có 8+30 GiB; không xóa legacy volume.

Kiểm read-only ECR cho [bốn digest lịch sử](evidence/ops-observability-2026-11-19/previous-artifacts.json) từ release 09/11 được ghi riêng; tồn tại artifact không chứng minh schema-compatible rollback hay khả năng release role kéo ảnh.

Có snapshot automated encrypted available ngày 18/11 16:15Z và manual ngày 09/11; không thử restore. Ba log group ứng dụng có retention 7 ngày; storedBytes báo 0 không có nghĩa không có log. Một trang filter error trả 0 và còn next token, **không** chứng minh không lỗi. Dashboard `commerce-app-demo` tồn tại; mới kiểm sự tồn tại, không diễn giải nó đã có telemetry mới.

Hai watchdog alarms OK, autoscaling CPU high OK/low ALARM tại thời điểm lấy mẫu. SNS list subscriptions rỗng: chưa có kênh confirmed, chưa chứng minh nhận cảnh báo. OIDC list/get bị SCP AccessDenied; không né SCP hay suy trust đã đúng. Free Tier plan FREE/ACTIVE; không đọc hóa đơn/credit/spend limit balance, không coi đó là quyền chi hoặc gross cost bằng không. Không lấy secret values, customer log hoặc SNS endpoint.

CI/API tests thành công đúng baseline `13a9d25`: [CI](https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/44353301472), [API tests](https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/44353301290). CI jobs documentation/verify/browser-container/security-audit-evidence/cloudformation success. Security-audit-evidence success nghĩa job thu evidence hoàn tất, không nghĩa audit không vulnerability. Không chứng minh OIDC image publish hay deployment tự động. Bootstrap/catalog/Admin/COD đã có [bằng chứng preview](aws-preview-2026-11-18.md); readiness đã bỏ khẳng định cũ rằng chưa từng nghiệm thu các bước đó.

## Giá Sydney và mô hình gross

Lấy giá public AWS ngày UTC 18/11/2026, không gọi Pricing resource API vùng khác. Host `pricing.us-east-1.amazonaws.com` là endpoint public bulk file; nội dung regional lấy đúng `ap-southeast-2`, không tạo/đọc regional resources ngoài Sydney. [Price-list trích lọc](evidence/ops-observability-2026-11-19/pricing.json), [giá biến phí](evidence/ops-observability-2026-11-19/variable-pricing.json), [dashboard](evidence/ops-observability-2026-11-19/dashboard-pricing.json), [mô hình tính](evidence/ops-observability-2026-11-19/cost-model.json).

Đơn giá USD: Fargate x86 vCPU 0,04856/giờ + RAM 0,00532/GiB-giờ; RDS t4g.micro 0,025/giờ; Redis EC2 t4g.micro 0,0106/giờ; ALB 0,0252/giờ + 0,008/LCU-giờ; IPv4 0,005/address-giờ. RDS gp3 0,138/GiB-tháng, EBS gp3 0,096/GiB-tháng. Nguồn regional AWS trực tiếp nằm trong price-list JSON. [IPv4](https://aws.amazon.com/vpc/pricing/), [Secrets](https://aws.amazon.com/secrets-manager/pricing/) 0,40/secret-tháng, [KMS](https://aws.amazon.com/kms/pricing/) 1/key-tháng; customer key một, không tính AWS-managed keys như customer keys. [ECR private storage](https://aws.amazon.com/ecr/pricing/) 0,10/GiB-tháng.

Giả định một task mỗi vai trò = 2 vCPU/5 GiB, sáu IPv4 chạy (3 task, 2 ALB, 1 Redis), một LCU: **0,22252 USD/giờ**. Fixed retained 12,008 USD/tháng gồm RDS 20 GiB, EBS 38 GiB, ba secrets, một customer key, một dashboard gross 3 USD, bốn standard alarm metrics gross 0,40 USD. Ví dụ thêm S3 1 GiB/ECR 10 GiB/log ingest 1 GiB/log storage 1 GiB = 1,728 USD/tháng; tổng retained mô hình **13,736 USD/tháng**. S3/ECR/log volumes là giả định, chưa đo usage; gross bỏ free allowances/credits.

| Kịch bản giả định | USD trước biến phí chưa định lượng | Cộng reserve ví dụ 20 USD |
| --- | ---: | ---: |
| 4 giờ, incremental compute/network | 0,89008 | Không phân bổ reserve tháng |
| 40 giờ/tháng, hibernate ngoài phiên | 22,6368 | 42,6368 |
| 40 giờ/tháng, pause giữ ALB/2 IPv4 ngoài phiên | 46,9248 | 66,9248 |
| 730 giờ chạy | 176,1756 | 196,1756 |
| Compute dừng cả tháng, giữ ALB/2 IPv4 | 39,4320 | 59,4320 |

Đây là kịch bản tính toán, không đề nghị thực hiện hibernate/pause. RDS tự restart có thể phá giả định compute dừng cả tháng. Chưa gồm egress/inter-AZ/request, excess CPU credits, snapshots/backup vượt allowance, overlap migration/release/scale-out, watchdog requests, DNS/domain, scanning, key rotation hoặc thuế. Reserve 20 USD là allowance minh họa, không là upper bound hóa đơn. Trần USD100 chưa duyệt: mô hình có reserve cho tối đa khoảng 297 giờ nếu hibernate hoặc 216 giờ nếu pause giữ ALB, **chưa** tính mọi biến phí. Không dùng số giờ này làm lease/approval. Always-on vượt trần thiết kế; owner phải quyết định ngân sách/giờ/dữ liệu retained, không tự scale hoặc xóa dữ liệu.

## Chưa khép và cleanup

Chưa nghiệm thu load dài/5x/10x/endurance, concurrency/lost response/last-unit, Redis outage, notification delivery/retry/final failure, alert receipt/ack, restore/RPO/RTO/rollback, billing/spend-limit thực và OIDC trust (SCP deny). Consumer personalization completed không là notification delivered. Người sở hữu phải chốt ngưỡng workload, kênh/người trực, retry semantics và ngân sách; không có owner approval được suy diễn.

Chỉ xóa hai container local disposable của lượt này và secret tạm local sau các kiểm tra; [cleanup ledger](evidence/ops-observability-2026-11-19/cleanup.json) ghi kết quả. Không tác động container cũ, AWS preview, RDS/Redis/S3/ECR/cloud secrets hoặc lease.

## Bổ sung kiểm kê và quyết định của người yêu cầu

Kiểm kê Admin API chỉ đọc với projection tối thiểu được lưu ở [admin-inventory.json](evidence/ops-observability-2026-11-19/admin-inventory.json); chỉ lưu số lượng, không email, user ID hay giá trị key. Đây là trạng thái của preview đang chạy, không chứng minh guard Staff mới đã được deploy.

Người yêu cầu **hoãn kiểm gửi/nhận cảnh báo ngày 19/11/2026**. Không tạo subscription hoặc gửi email; địa chỉ dự kiến được bàn giao riêng, không đưa vào báo cáo. Alert delivery được đánh dấu DEFERRED BY REQUESTER, không PASS.
