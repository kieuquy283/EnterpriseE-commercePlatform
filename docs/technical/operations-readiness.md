# Sẵn sàng vận hành và kế hoạch kiểm chứng

OPS-06/07 theo [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md), [hợp đồng vận hành](../spec/06-operations.md), [runbook](../../deploy/RUNBOOK.md) và [cổng dependency](dependency-security.md). Hướng dẫn này xác định cổng; kết quả phiên nằm trong [báo cáo có ngày](../report/ops-observability-2026-11-19.md). Không coi cấu hình là runtime hoặc phê duyệt ngân sách.

## Cổng phát hành

| Hạng mục | Điều kiện kiểm trước từng release |
| --- | --- |
| ECS/API/worker/storefront | Đối chiếu source SHA, digest mới và digest quay lui; desired/running, target khỏe và business readback. Worker stable không chứng minh notification delivery |
| RDS/Redis | Đúng target, schema tương thích, recovery point đủ mới; diễn tập restore vào DB mới, headroom và quyền truy cập. Snapshot tồn tại không chứng minh RPO/RTO |
| HTTPS/DNS/media | Certificate/expiry, DNS theo ALB hiện tại, render storefront, raster readback và từ chối S3/private prefix |
| OIDC/CI | CI thành công đúng SHA và artifact; trust/audience/environment/reviewer/quyền publisher phải kiểm riêng. CI pass không chứng minh OIDC publish hoặc release tự động |
| Lease/watchdog/alert | Chủ phiên và cửa sổ UTC, kiểm đúng hạn; subscription confirmed và diễn tập nhận/ack. Lease best-effort không là spending cap |
| Bootstrap/Admin | Runner một lần có target/hash guard, dry-run/apply tách, readback catalog/media/Admin và cleanup secret; không rerun seed mù. Staff authorization và notification có bằng chứng riêng |

Preview 18/11 đã có bằng chứng bootstrap/catalog/media/Admin/COD tại [báo cáo AWS](../report/aws-preview-2026-11-18.md); không tiếp tục gọi các bước đó là chưa từng chạy. Bằng chứng đó chỉ áp dụng phiên/digest đã ghi, không chứng minh mọi lần phát hành sau. CI/API tests tại baseline đã có run thành công; URL và giới hạn nằm trong báo cáo OPS. Không sửa báo cáo lịch sử để đổi verdict.

Trước thao tác ghi: xác nhận selected Region ap-southeast-2, project/stack/DB, paid/free plan, spend limit/gross billing, người trực, UTC bắt đầu/kết thúc và quyền thực hiện. Không đọc/in bí mật để kiểm kê. Read-only inventory có ngày không cấp quyền renew/start/pause/hibernate hoặc gửi SNS.

Checklist: SHA/lock → dependency/CI → cặp digest mới/cũ → change set không replacement/removal retained data → backup và restore drill → tương thích schema → cửa sổ bảo trì → start được cấp phép → business readback → worker/alert → kết luận/rollback. Helper start rút traffic và migrate; không hứa zero downtime. Không đảo migration/reset DB/seed lại để chữa lỗi. Schema không tương thích cần kế hoạch dữ liệu riêng.

## Chi phí và lease

Tính gross USD trước credits/free-tier; không đồng nhất plan FREE với chi phí bằng không. Phiếu phiên phải có giá Sydney theo ngày, CPU/RAM task, ALB/LCU/IPv4, RDS/Redis, storage retained, log, backup và deployment overlap. [Mô hình có ngày](../report/evidence/ops-observability-2026-11-19/cost-model.json) ghi nguồn giá công khai và giả định; không thay hóa đơn. File `cost-estimate.json` tháng 10 là lịch sử.

`phiên = giờ chạy × đơn giá chạy + biến phí + retained phân bổ`; `tháng = các phiên + retained cả tháng + ALB/IPv4 còn giữ ngoài phiên + biến phí`. Pause giữ ALB tính phí; hibernate cần quyền riêng và vẫn giữ dữ liệu/ECR/secrets/key/snapshot. RDS có thể tự khởi động sau thời gian stop giới hạn; không mặc định dừng cả tháng. Không xóa legacy storage để giảm mô hình. Trần thiết kế USD100/tháng vẫn chờ chủ dự án duyệt; ngưỡng/ngân sách và giờ hoạt động phải được xác nhận trước cấp chi phí mới.

## Logging, metrics và alert

[Hợp đồng observability](observability.md) mô tả export `requestObservability`, mount đầu tiên do người sở hữu middleware thực hiện, request/operation/order join keys, allowlist và top-level JSON qua logger Medusa. Bằng chứng production transport local không chứng minh image AWS đang chạy có instrumentation mới. Không log body/auth/cookie/PII/error provider thô, không dùng ID làm dimension metric.

IaC dashboard theo dõi CPU/RAM ba vai trò, ALB latency/5xx và RDS headroom; thay đổi nguồn chưa apply. Redis EC2 không tự có memory/eviction/queue metrics. Alarm watchdog/autoscaling không đủ cho checkout/job/availability. Không subscription hoặc pending confirmation đều chưa là kênh cảnh báo hoạt động. Thử alert có thể gửi SNS nên cần quyền riêng; không thử bằng tắt watchdog.

| Tín hiệu | Phản ứng đề xuất, cần owner chốt |
| --- | --- |
| Probe API/storefront mỗi 60s trong cửa sổ công bố | Hai lần liên tiếp fail: người trực điều tra; tách liveness với readiness/hành trình |
| API lỗi >=1%/5 phút với >=100 requests, hoặc hết target khỏe hai mẫu | Điều tra/dừng thử; ít traffic dùng probe. Không tự tăng capacity |
| RDS CPU/connections/free memory/storage; worker/storefront saturation | Chọn headroom theo baseline, kiểm DB pool trước scale API |
| Job accepted/completed/retry/final failure và tuổi hàng đợi | Backend consumer phải cung cấp số đo thực; personalization callback không chứng minh thông báo |
| Recommendation lỗi/dự phòng | Đo riêng, không để gợi ý tùy chọn che lỗi commerce |

Mục tiêu acknowledge đề xuất <=10 phút chưa là cam kết được duyệt. Diễn tập phải ghi UTC lỗi → alarm transition → người nhận acknowledge → phục hồi/OK; kiểm readiness subscription bằng boolean/protocol không gửi thông báo.

## Workload và fault cô lập

Chỉ chạy trên fresh disposable services có chủ sở hữu; không load public AWS/shared DB. Script catalog/checkout hiện chỉ nhận loopback HTTP. K6 chạy Docker host network cho local test; không bỏ guard để trỏ public preview. Xác nhận fixture/version, region/channel, SKU, tồn ban đầu, expected state và stop conditions trước load.

`load/catalog.js`: mix cố định 60% list/20% detail/20% search, fixture không rỗng/unique/bounded và tìm đúng sản phẩm. Baseline 30 iteration/s, 10 phút; smoke 10 iterations. Check contract phải đạt 100%, HTTP lỗi <1%, dropped=0; p95<600ms chỉ steady catalog, setup tách riêng. Một iteration tạo một request workload, setup không tính achieved workload RPS.

`load/checkout.js`: 3 intent/s trong 5 phút; smoke một intent. Mỗi intent có operation ID, checks=100%, completed>0, reconciled=100%, dropped=0, request lỗi<1%; complete request p95<1500ms và toàn intent p95<10000ms là hai ngưỡng riêng, cần QA duyệt. Retry tuần tự cùng cart phải trả cùng order; readback cart completed/tổng/currency/line quantity khớp. Mapping synthetic intent→cart→order ghi để đối soát; không log địa chỉ/email. Server-side suite đọc order/inventory qua query framework để kiểm một hiệu ứng và tồn giảm một. Chưa chứng minh concurrent checkout, payment settlement, last-unit contention hoặc lost-response idempotency.

`load/recommendations.js`: p95 chỉ metric `kind:recommendation`, tách setup; không thay catalog/checkout. Rate/duration thay đổi phải ghi trong manifest; không tự nhận mọi ngưỡng là phê duyệt nghiệp vụ.

`integration-tests/http/load-smoke.spec.ts` là harness tái sử dụng opt-in `RUN_LOCAL_K6=true`, dùng test runner DB mới, Docker k6 1.4.2 và biến `OPS_EVIDENCE_DIR`. Fault yêu cầu `OPS_LOCAL_POSTGRES_CONTAINER` đúng prefix owned `daymark-ops06-pg-...`; chỉ truyền container mới do chính lượt thử tạo, không container dùng chung. Pause riêng DB, catalog timeout 5s phải fail, unpause trong finally rồi workload recovery phải pass. Không phải diễn tập ECS failover/Redis/restore. Mặc định suite k6 skip để không âm thầm yêu cầu Docker từ mọi HTTP test; skip không được tính PASS workload. Không thêm CI wrapper.

Thứ tự thử dài: preflight → smoke → warm/cold baseline → mix đã duyệt → 5x/10x ramp/hold → recovery/endurance nếu được cấp tài nguyên. Ghi offered/achieved RPS, completed intents, dropped, p50/p95/p99, resource timeline. Dừng khi invariant sai, OOM/pool cạn; đề xuất lỗi hệ thống >5%/60s thì dừng. DB/Redis outage ghi/checkout, worker retry/final failure, concurrency và restore còn cần drill riêng. LCP cần browser riêng.

TODO(test): QA chốt mix/ngưỡng và thực hiện load dài, Redis/worker/concurrency/restore cô lập — smoke không đủ nghiệm thu NFR; OPS-07.

## Evidence và quyết định còn mở

Mỗi run ghi SHA+dirty paths, lock/dataset/image hash nếu liên quan, UTC, phiên bản công cụ, target alias cô lập, workload/ngưỡng, lệnh/exit, summary/raw logs làm sạch, server reconciliation và cleanup ledger. Lần fail giữ nguyên; sửa và rerun ghi attempt mới. Artifact CI cần giữ cả fail/cancel và retention được duyệt; không tạo wrapper chỉ để bọc lệnh có sẵn. Không đưa credentials/URL DB/PII vào artifact.

Còn quyết định của owner: ngân sách gross và giờ chạy; ngưỡng/traffic mix; người trực/kênh nhận alert/ack; restore/rollback window; notification provider/retry semantics. Không suy ra phê duyệt từ một PR, một dashboard, CI pass hoặc preview đang khỏe.
