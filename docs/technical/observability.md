# Quan sát request và thao tác nghiệp vụ

OPS-06/07 nối log ứng dụng với [hợp đồng vận hành](../spec/06-operations.md). Dùng logger Medusa và CloudWatch Logs hiện có; không thêm tracing service. Kết quả thực thi thuộc [bằng chứng có ngày](../report/ops-observability-2026-11-19.md), không suy runtime từ cấu hình dashboard.

## Hợp đồng tích hợp

`apps/backend/src/observability/index.ts` xuất `requestObservability`, `logOperation`, `boundedId`, `orderOperationId`. Người sở hữu `src/api/middlewares.ts` đăng ký `requestObservability` đầu tiên cho matcher `/*`, trước auth/validation/routes, để quan sát cả lỗi 4xx/5xx. Helper không tự mount. Kiểm HTTP cô lập trực tiếp helper không chứng minh bản cloud đã mount.

Mỗi request có UUID mới trong `req.requestId` và response `x-request-id`. `x-operation-id` hợp lệ được giữ qua retry; thiếu/sai được thay UUID. Chỉ nhận chuỗi ASCII `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`; không nhận array, khoảng trắng, ký tự điều khiển hay email. Đây là nhãn do client cung cấp, **không** là danh tính, quyền truy cập hoặc khóa idempotency. Client giữ cùng operation ID khi thử lại một intent; mỗi HTTP attempt vẫn có request ID riêng. Không dùng các ID này làm CloudWatch metric dimension.

Khi JSON hoàn tất checkout chứa `type=order` và order ID hợp lệ, log ghi `business_operation_id=order.<32 ký tự SHA-256>`; subscriber personalization dùng cùng hàm cho order placed/canceled. Đây là join key giả danh hóa, không bảo đảm ẩn danh; chỉ người có quyền đọc log mới được dùng. Không ghi order ID, customer ID hoặc dữ liệu khách thô trong helper. Request trước khi có order vẫn nối bằng operation ID; không tuyên bố correlation tự truyền qua mọi workflow hay provider.

Subscriber hiện có ghi started/completed/failed rồi ném lại lỗi để framework xử lý. `completed` nghĩa handler personalization trở về, có thể bỏ qua vì không có consent/items; không nghĩa notification đã gửi. Feature gate tắt thì không phát telemetry của handler. Không tạo consumer notification khác. Attempt number/final-failure/queue age phải do consumer notification thực cung cấp khi Backend triển khai; không suy từ callback này.

## Schema và bảo vệ dữ liệu

Logger Medusa dùng overload được hỗ trợ `logger.log(level, event, entry)`; transport production phát JSON với trường cấu trúc ở top level. Không dùng `info(JSON.stringify(entry))`, vì nó escape entry vào `message` và làm sai JSON metric filter. Trường cho phép: `timestamp_utc`, `service` (`api` hoặc `worker` theo `WORKER_MODE`), `release_sha` từ `RELEASE_SHA` hợp lệ, `event`, `request_id`, `operation_id`, `business_operation_id`, `route_template`, `method`, `status_code`, `duration_ms`. IaC có parameter `ReleaseSha` mặc định `unversioned`, cùng giới hạn ID, inject API/worker. Người phát hành truyền SHA nguồn tương ứng digest; mặc định đó không chứng minh provenance. Không thay cloud trong lượt này.

Helper chỉ chiếu trường cho phép, không spread dữ liệu caller. Không log body/query/auth/cookie/password/token/email/địa chỉ/raw provider error. Route biết trước được chuẩn hóa `/:id`; route khác là `other`, không ghi path thô. Lỗi server/connection aborted dùng error, request hoàn tất còn lại dùng info. Một request chỉ có một terminal record dù cả `finish` và `close` phát ra. Response aborted không có status thành công giả. Đây không là bộ lọc mọi log của Medusa/provider; review transport/framework log riêng trước công bố artifact.

## Truy vấn và phản ứng

Trong CloudWatch Logs Insights chọn log group API/worker theo cửa sổ UTC. Transport production đã được kiểm bằng process Node riêng với logger Medusa thật, không mock; trường JSON ở top level:

```text
fields @timestamp, event, request_id, operation_id, business_operation_id, status_code, duration_ms, release_sha
| filter event in ["http.completed", "http.aborted", "order.event.failed"]
| sort @timestamp desc
| limit 100
```

JSON filter dự kiến `{ $.event = "http.completed" && $.status_code >= 500 }`; metric latency dùng `{ $.event = "http.completed" && $.duration_ms = * }` và value `$.duration_ms`. Đây là hợp đồng filter đã kiểm shape tại local; chưa tạo metric filter/alarm cloud hay tuyên bố metric có dữ liệu. Không thêm dimension request/order ID. Logs cũ chứa escaped entry cần parse riêng, không trộn với schema mới để báo pass.

Tìm operation ID bằng chuỗi bounded cụ thể trong cửa sổ ngắn; không nhập email/token. Đối soát intent→order qua mapping synthetic của k6 và truy vấn module/query có quyền, không lấy HTTP 200 làm đúng đắn. Log request không thay probe sẵn sàng theo lịch, không tính 99,5% từ lượng traffic tự chọn.

Dashboard IaC bao gồm CPU/memory API, worker, storefront; p95/5xx ALB; RDS CPU/connections/free memory/free storage từ export DatabaseId. Không có metric Redis memory/evictions từ EC2 mặc định và không có metric queue nghiệp vụ; cần đo nguồn thật trước đặt alarm. Thay đổi nguồn chưa apply. Alarm watchdog/autoscaling không là cảnh báo nghiệp vụ hoặc chứng minh người trực nhận thông báo.

Kiểm gửi/nhận cảnh báo SNS được người yêu cầu hoãn ngày 19/11/2026. Không tạo subscription hoặc gửi email; kiểm kê chỉ đọc không chứng minh delivery. Khi mở lại, cần người nhận xác nhận subscription và ghi thời gian nhận/ack; OPS-06.

TODO(test): QA chốt workload/ngưỡng và đo baseline dài, DB/Redis outage, worker retry/final failure, 5x/10x và recovery — smoke cô lập không là năng lực production; OPS-07.
