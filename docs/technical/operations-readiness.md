# Sẵn sàng vận hành và kế hoạch kiểm chứng

Phạm vi OPS-06/07 của [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md): rà nguồn và chuẩn bị thao tác; không nghiệm thu cloud. Hợp đồng ở [đặc tả vận hành](../spec/06-operations.md); lệnh thực thi và bootstrap ở [runbook](../../deploy/RUNBOOK.md). Đánh giá dependency dùng [cổng bảo mật](dependency-security.md). Mọi đề xuất ngưỡng/ngân sách cần Quý duyệt; không đổi stack, thêm dịch vụ trả phí hay cấp quyền chạy.

## Cổng phát hành và kiểm kê

`CONFIGURED` chỉ nghĩa có nguồn cấu hình; `NOT VERIFIED` nghĩa chưa kiểm runtime. Báo cáo lịch sử không thay kiểm kê phiên phát hành.

| Hạng mục / nguồn | Có trong nguồn | Bằng chứng phải thu trước release / owner |
| --- | --- | --- |
| ECS API/Admin, worker, storefront; `deploy/cloudformation/app.yaml` | Task definition, health, API autoscaling trần hai task | NOT VERIFIED: task/digest thực, desired/running, target khỏe, worker hoàn tất việc; Thắng |
| RDS / Redis; `data.yaml` | RDS Single-AZ, Redis EC2, ingress hạn chế, retained data | NOT VERIFIED: đúng DB, schema, snapshot/restore, kết nối và headroom; Trung |
| ALB / DNS / ACM; app/foundation | HTTPS routing, health `/health`, DNS tùy chọn | NOT VERIFIED: chứng chỉ hợp lệ/expiry, CNAME đúng ALB sau hibernate, render `/vn`; Thắng/Quý |
| S3 / media | Bucket riêng, file provider, proxy `public-images/` | NOT VERIFIED: quyền thực, raster readback, direct S3/private-prefix denial, ảnh storefront; Thắng/Trung |
| OIDC / immutable release | `aws-images.yml` xuất `aws-release.json`; publisher không deploy | NOT VERIFIED: trust/environment reviewers/quyền thực, run publish, digest đang chạy và digest quay lui; Thắng |
| Lease / watchdog / SNS | Giới hạn tối đa 12 giờ, kiểm mỗi 5 phút, log/DLQ, budget alert | NOT VERIFIED: lease thực, subscription confirmed, nhận alert, shutdown thực và residual cost; Thắng |
| Bootstrap / first Admin | Baseline seed, importer `cloud-demo` target/hash guards, bootstrap Admin qua secret injection | Chưa nghiệm thu cloud: runner một lần cần verify data/media/Admin và cleanup secret; xem runbook; Hoàng/Trung/Thắng |

Trước phiên được duyệt: xác nhận Region ap-southeast-2 trong AWS Settings, đúng project/stack/DB, chủ phiên và giờ UTC bắt đầu/kết thúc; kiểm paid plan/credit/spend limit và gross billing. Không đọc/in bí mật để lập inventory. Phiên source-only này không gọi AWS, kể cả read-only.

Checklist release: SHA và lock hash → gate dependency/CI → hai digest mới và cặp digest trước → review change set, không replacement/removal retained data → backup đủ mới và restore drill cô lập → schema tương thích app trước → lịch bảo trì → bootstrap rõ đối tượng nếu cần → start đã duyệt → catalog/media/Admin/checkout readback → worker/alert nếu đã triển khai → kết luận hoặc rollback. `start` rút traffic và chạy migration; không hứa zero downtime, không tự seed/admin khi startup. Quay lui digest tương thích schema; không đảo migration, reset DB hay seed lại để chữa lỗi. Khi schema không tương thích, dừng phát hành và Trung lập kế hoạch dữ liệu riêng.

## Lease, ngân sách và chi phí

Đề xuất cửa sổ đầu 4 giờ, người trực kiểm trước hạn; chỉ renew khi còn nhu cầu và ngân sách được duyệt. Lease best-effort không là spending cap; budget alert trễ và không tắt tài nguyên. `pause` giữ ALB tính phí; hibernate xóa app stack cần quyền riêng, giữ data/watchdog/storage/ECR/secrets/key. Không tự xóa foundation/data hoặc tài nguyên cũ.

Không có báo giá/hoá đơn hiện tại trong lượt này. Số trong `cost-estimate.json` chỉ là mô hình lịch sử, không dùng làm chi phí hiện tại. Trần thiết kế USD100/tháng trong đặc tả còn chờ duyệt, không cấp quyền chi.

Phiếu chi phí bắt buộc điền trước phiên: ngày/nguồn giá Sydney; USD/giờ Fargate API+worker+storefront, ALB giờ+LCU, IPv4, RDS và Redis compute; USD/tháng storage RDS/EBS/S3/ECR, backup, secrets/KMS, logs; biến phí request/egress và thời gian chồng lấn migration/release. `chi phí phiên = số giờ × tổng đơn giá chạy + biến phí + phần retained phân bổ`; `tháng = các phiên + retained cả tháng`. Giá/giờ, tổng phiên và số dư gross budget đều **NOT VERIFIED/TBD**, không được phê duyệt phiên khi chưa điền. Quý phê duyệt ngân sách; Thắng tính và đối soát billing sau phiên.

## Điều kiện bootstrap cloud

| Khoảng trống đã thấy từ nguồn | Hành động / điều kiện đóng |
| --- | --- |
| `seed-commerce.ts` thấy Vietnam thì chỉ đồng bộ payment providers rồi return; không sửa key/channel/location/shipping còn thiếu. Trước khi có Vietnam, lỗi giữa các workflow có thể để lại trạng thái từng phần | Hoàng/Trung chuẩn bị preflight và workflow sửa có chọn lọc; không rerun mù, không SQL/reset; so sánh ID/count/stock/orders trước-sau |
| Importer mặc định giữ guard local; `cloud-demo` yêu cầu production/Sydney RDS target và dataset hash chính xác; helper AWS chỉ có migrate/seed/publishable-key | Dùng task một lần theo runbook: dry-run/apply tách, hash cố định, bảo toàn tồn/đơn; nghiệm thu runtime còn cần ghi bằng chứng. Không giả local env hoặc tunnel để né guard |
| Manifest hiện gắn ảnh `representative`; `--images manifest` không nhận chúng; `demo` chỉ test loopback, không S3. H&M media importer cũng cấm cloud và chỉ DB thử riêng | Trung/Quý quyết định ảnh được quyền công bố, đúng nhãn; Thắng/Hoàng chuẩn bị đường upload S3 qua file provider được duyệt. Không đổi confidence để vượt guard; ảnh/cloud catalog chưa hoàn tất |
| CLI `user --invite` có hỗ trợ nhưng token ghi log; helper không có admin action và ECS Exec chưa được chứng minh | Thắng/Hoàng review runner một lần với logging không thu token, lease/exit/cleanup và kênh bàn giao bí mật; không truyền password/token trong ECS overrides, task definitions, CI/log artifact |
| Staff RBAC/license và notification chưa nghiệm thu/triển khai | Hoàng/QA sở hữu; Admin đầu tiên không chứng minh Staff allow/deny; Redis event bus không chứng minh thông báo đã gửi |

Mã bootstrap không thay bằng chứng runtime. Mỗi lần phát hành phải xác minh target, dry-run/apply, dữ liệu/ảnh/Admin và cleanup secret theo runbook; ghi kết quả riêng cho từng digest.

## Logging, metrics và alert

Nguồn `app.yaml` cấu hình awslogs cho ba vai trò, retention 7 ngày; dashboard hiện chỉ CPU/memory API và ALB target latency/5xx. Alarm Lambda watchdog trong app/data nối SNS; không coi đó là alarm đầy đủ cho checkout/DB/queue. Chưa kiểm log thực, dashboard hiện hữu, SNS confirmed hay nhận alert.

Rà custom API/subscribers chưa tìm thấy correlation ID xuyên request → workflow → worker. Có logger trong scripts nhưng không là telemetry nghiệp vụ. Backend cần triển khai và QA cần chứng minh bằng hai request độc lập, một retry và một job: cùng operation ID, request ID riêng, không lẫn khách.

Schema JSON đề xuất: `timestamp_utc`, `level`, `service`, `release_sha`, `run_id`, `request_id`, `operation_id`, `event_id`, `job_id`, `route_template`, `outcome`, `duration_ms`, `attempt`, `error_code`. ID phải bounded/validated, không dùng làm metric dimension cardinality cao. Không log body/auth headers/cookie/token/password/email/địa chỉ/connection string/provider error thô; dùng ID fixture giả hoặc ánh xạ hạn chế. Response công khai chỉ mã lỗi an toàn. Metadata UTC/release cho phép nối API với worker; chưa có nghĩa đã triển khai tracing service.

| Tín hiệu cần bổ sung | Đề xuất phản ứng / owner |
| --- | --- |
| Probe API+storefront/hành trình tổng hợp mỗi 60s trong cửa sổ công bố | 2 lần liên tiếp fail: cảnh báo người trực; probe liveness riêng readiness; Thắng/Quân |
| API/checkout lỗi, completed intents, latency và ALB unhealthy targets | Lỗi hệ thống >=1% trong 5 phút có >=100 request hoặc target khỏe bằng 0 qua 2 mẫu: điều tra/dừng thử; ít traffic dùng probe; Thắng/Hoàng |
| RDS CPU/connections/free memory/storage, Redis memory/evictions/errors, worker CPU/RAM | Lập baseline và headroom trước khi chọn ngưỡng; không tăng replicas khi chưa biết trần pool DB; Trung/Thắng |
| Job accepted/completed/retry/final-failed, queue depth và oldest age | Final failure cảnh báo ngay; lag ngưỡng TBD theo hợp đồng retry/provider; Hoàng triển khai, Quân đối soát |
| Notification attempts/success/final-failure; recommendation fallback/error | Notification NOT IMPLEMENTED; không nhận thông báo giả là pass. Gợi ý lỗi không chặn thương mại; Hoàng/Trung |

Kế hoạch nhận alert: môi trường cô lập được cấp phép, người nhận xác nhận subscription; tạo một lỗi kiểm soát, lưu UTC lỗi → alarm transition → người nhận acknowledge, phục hồi → alarm OK. Mục tiêu đề xuất acknowledge <=10 phút, cần duyệt. Nếu dùng cloud phải có quyền riêng vì có thể gửi SNS/tính phí; không thử bằng tắt watchdog. Không lưu email hay token trong ảnh bằng chứng.

## Kế hoạch fault/load cô lập

Đầu vào bắt buộc: QA chốt [workload](../04-workload/workload-analysis.md), fixture/version/hash, region/channel/key, SKU đủ tồn, expected state, rate/ramp/duration, giới hạn CPU/RAM và stop conditions. Chủ thử phải xác nhận target disposable, không shared/cloud DB; không restart/delete app/preview cũ. Tài nguyên mới đặt tên run-id, chỉ dọn tài nguyên chính mình tạo.

| Drill | Cách thử dự kiến | Chứng cứ đạt / phụ thuộc |
| --- | --- | --- |
| DB mất kết nối rồi hồi | Ngắt riêng network/proxy của DB thử trong 60s; gửi một intent, retry cùng định danh | Không báo order thành công giả; đọc lại một hiệu ứng đơn/tồn, ghi thời gian phục hồi; Hoàng/Trung/Quân |
| Redis gián đoạn | Ngắt dependency thử 60s, probe catalog/checkout/worker riêng | Phân biệt cache/lock/event failures; không khẳng định mọi workflow hoạt động; đọc lại job/order sau hồi |
| API task/process chết | Dừng đúng process thử có ghi nhận ID, không đụng container cũ | Đo outage/recovery, request đang bay, chống trùng retry; không suy local restart thành ECS failover |
| Provider thông báo lỗi/lặp | Stub thất bại → hồi, gửi event trùng và retry | BLOCKED tới khi Backend có provider/consumer: số attempt, một hiệu ứng hợp lệ, final-failure nhìn thấy |
| Đơn vị tồn cuối | Stock=1, hai intent độc lập đồng thời, nhiều vòng reset chỉ fixture mới | <=1 cam kết, không âm tồn; đối soát reservation/order/tiền; QA thực thi |
| Rollback/restore | Hai digest schema-compatible; restore backup sang DB MỚI cô lập | RPO <=60 phút, RTO <=120 phút là mục tiêu chưa đo; kiểm count/quan hệ/ảnh riêng, không chuyển DB dùng chung |

`load/catalog.js`: 30 iterations/s ×10 phút, chỉ list limit=20, p95<600ms và HTTP lỗi<1%; chưa có mix detail/search, threshold checks/dropped iterations hoặc kiểm đúng sản phẩm. Không gọi đây là đủ WL-CAT-001.

`load/checkout.js`: 3 intent/s ×5 phút, tạo cart/address/shipping/payment collection/COD order; `SMOKE=1` tạo một intent. p95<1500ms hiện chỉ request `step:complete`, không là toàn hành trình. `check(order created)` chưa có threshold nên HTTP 200 với kết quả sai có thể chưa fail gate; chưa đối soát tiền/tồn/order hay chống gửi lặp. Cần QA bổ sung checks threshold, dropped iterations=0, intent duration riêng, mapping intent→order và đọc lại trạng thái. Không chạy script này trên target chưa được duyệt.

`load/recommendations.js`: rate/duration tùy biến, checks>99%, dropped=0, p95<800ms; smoke health/setup cùng metric duration nên cần tách steady-state. Gợi ý là scope tùy chọn, không thay catalog/checkout.

Thứ tự Tuần 2: preflight → smoke → baseline warm/cold tách → catalog mix duyệt 30 RPS/10 phút và checkout 3 intent/s/5 phút → stress 5x/10x có ramp/hold do QA duyệt → recovery → endurance nếu còn ngân sách. Đây là TEST-TARGET, chưa là capacity. Tách expected business 4xx khỏi 5xx/timeout/kết quả sai; ghi offered/achieved RPS, completed intents, dropped iterations, p50/p95/p99 và resource timeline. Dừng ngay khi invariant đơn/tồn sai, OOM hoặc pool cạn; đề xuất dừng khi lỗi hệ thống >5% trong 60s. Không tăng capacity tự động để làm đẹp số đo. LCP cần browser test riêng.

TODO(test): Quân chốt mix/ngưỡng, đối soát và artifact k6 — scripts hiện chưa đủ bằng chứng NFR; OPS-07, phối hợp Hoàng/Trung instrumentation/DB.

## Hợp đồng evidence CI

Lưu `docs/report/evidence/<run-id>/` hoặc CI artifact tương ứng: manifest chứa SHA+dirty paths, lock/image/dataset hashes, start/end UTC, Node/npm/k6, environment không bí mật, isolated target alias, workload/thresholds, commands, exit codes, skipped/blocked reasons; audit JSON, k6 raw summary, redacted logs, metrics timeline, assertions đối soát và cleanup ledger. Không gắn secret URL hay PII. Artifact phải upload cả khi fail/cancel, tên gồm run-id/SHA/attempt; đề xuất retention 30 ngày, duyệt theo ngân sách. Chạy lại tạo run-id mới, không sửa bằng chứng cũ. CI run URL và source revision phải đọc lại được; một report HTML không chứng minh flow pass nếu thiếu assertion/raw output.

## Phụ lục rà nguồn có ngày: 18/11/2026

Mỗi lượt kiểm ghi SHA/digest, UTC, môi trường, lệnh, expected/actual và verdict. Kiểm tra nguồn hoặc tài nguyên đã cấu hình không chứng minh runtime, alert, restore hay năng lực. Lưu bằng chứng làm sạch tại `docs/report/`; không đưa mật khẩu, token, URL DB hay PII vào artifact.
