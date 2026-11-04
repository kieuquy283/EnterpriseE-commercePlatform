# Chạy kiểm thử Inventory tuần 4 tự động

Runner: `C:/demo1/EnterpriseE-commercePlatform/apps/backend/src/scripts/check-week4-inventory.ts`.

Script tự tạo cart và gọi các luồng checkout qua Store SDK/API để thu bằng chứng W4-02, W4-03, W4-04 và W4-05. Nó dùng fixture tuần 4 đã có; không seed lại, reset stock hoặc xóa reservation lịch sử. W4-01 thành công/capture tiếp tục dùng bộ JSON lịch sử, có thêm lần đọc hiện tại để bổ sung Cart–Order link và cấu hình fixture.

## 1. Điều kiện trước khi chạy

- npm là package manager của repository; dependency Medusa cài trong dự án là 2.21.2.
- PostgreSQL và Redis local đang hoạt động; backend tại `http://127.0.0.1:9000`.
- Cấu hình backend trỏ đúng database local của các evidence trước, không production.
- Provider `pp_week4_local` đã được cài và bật cho Vietnam cùng `pp_system_default`.
- Có đúng một SKU `W4-INVENTORY-TEST`, product published, `manage_inventory=true`, `allow_backorder=false`, một inventory item, một level/kho và `required_quantity=1`.
- Product/kho thuộc Online Store, có publishable key đang hoạt động, giá VND và shipping option phù hợp.
- Fixture còn ít nhất **2 đơn vị available**, tính từ số hiện tại, không từ snapshot cũ.
- Không chủ động chạy checkout, fulfillment hoặc điều chỉnh inventory khác cùng lúc.

Nếu thiếu điều kiện, script dừng và ghi failure thay vì tự thay dữ liệu để ép bài kiểm thử chạy được.

## 2. Hạ tầng và backend

Mở PowerShell tại repository. Nếu PostgreSQL/Redis chưa chạy:

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform'
docker compose up -d postgres redis
```

Chạy backend trong terminal riêng. Nếu đã có backend chạy với đúng cờ test và đúng DB, dùng instance đó, không mở thêm server cùng cổng.

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform\apps\backend'
$env:NODE_ENV = 'development'
$env:WEEK4_INVENTORY_TESTS = 'true'
npm run dev
```

Dùng `npm run dev` trực tiếp tại apps/backend để cờ được truyền vào Medusa. Root `backend:dev` đi qua Turbo strict và cấu hình hiện tại chưa allowlist biến test.

Trong terminal kiểm thử khác, kiểm tra health:

```powershell
(Invoke-WebRequest 'http://127.0.0.1:9000/health' -UseBasicParsing).StatusCode
```

Expected 200. Giữ terminal backend mở trong khi chạy suite.

## 3. Kiểm tra code khi chuẩn bị hoặc thay đổi runner

Từ root:

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform'
npm run typecheck --workspace @dtc/backend
npm run lint --workspace @dtc/backend
npm run build --workspace @dtc/backend
```

Các kiểm tra cần thành công. Khi chỉ đọc lại evidence của một run đã kết thúc, không cần chạy lại suite hoặc build.

## 4. Cú pháp và preflight

Root wrapper gọi trực tiếp workspace npm, không qua Turbo:

```text
npm run backend:check:inventory-week4 -- UNIQUE_RUN_ID [preflight]
```

Run ID chỉ gồm chữ, số, gạch dưới hoặc gạch ngang, dài tối đa 100 ký tự. Thư mục evidence phải chưa tồn tại, kể cả thư mục của lần dừng giữa chừng.

Trong terminal kiểm thử, chạy preflight với ID mới:

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform'
$env:NODE_ENV = 'development'
$env:WEEK4_INVENTORY_TESTS = 'true'
$week4PreflightRun = 'preflight-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
npm run backend:check:inventory-week4 -- $week4PreflightRun preflight
```

Expected log `Week 4 preflight passed`. Preflight kiểm tra fixture/provider, chụp hiện trạng, lưu môi trường/source và **chưa tạo Cart/Order**.

Preflight dùng một run ID riêng. Không dùng lại ID này cho lệnh chạy đầy đủ.

## 5. Chạy đầy đủ

Chỉ thực hiện khi preflight hiện tại đạt và đã hiểu tác động giữ hàng của W4-04:

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform'
$env:NODE_ENV = 'development'
$env:WEEK4_INVENTORY_TESTS = 'true'
$week4SuiteRun = 'suite-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
npm run backend:check:inventory-week4 -- $week4SuiteRun
```

Hoặc từ apps/backend:

```powershell
Set-Location 'C:\demo1\EnterpriseE-commercePlatform\apps\backend'
$env:NODE_ENV = 'development'
$env:WEEK4_INVENTORY_TESTS = 'true'
$week4SuiteRun = 'suite-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
npm run check:inventory-week4 -- $week4SuiteRun
```

Hai đoạn trên là hai cách gọi cùng runner; chọn một cách cho một lần chạy. Mỗi lần gọi đầy đủ tạo dữ liệu test mới. Không chạy cả hai để thử cùng một suite.

## 6. Các ca được thực hiện

| Ca | Thao tác | Expected |
| --- | --- | --- |
| W4-01 supplement | Đọc Order lịch sử và Cart–Order link, chụp dữ liệu hiện tại; lưu hash của 13 JSON gốc | Bổ sung truy vết, không capture lại và không dựng timestamp snapshot lịch sử |
| W4-02 | Cart mới đủ shipping/payment, `pp_week4_local` với outcome fail; Complete | HTTP400 not_allowed do provider từ chối; session error; inventory/reservation trở về baseline, cart chưa completed, không active Order link |
| W4-03 | Cart mới có payment session nhưng thiếu shipping; Complete | HTTP400 invalid_data liên quan shipping; inventory/reservation không đổi |
| W4-04 | Chuẩn bị A mua N−1 và B mua2 khi available=N>=2; Complete A rồi Complete B | A tạo Order/reservation đúng; B thiếu hàng; sau B không thay đổi so với baseline lấy sau A |
| W4-05 | Complete lại cart A đã thành công | Cùng Order ID, không thêm Order/Payment/Reservation hoặc thay inventory |

W4-02/W4-03 lưu T0 trước chuẩn bị cart, T1 ngay trước Complete và T2 sau Complete/compensation. Runner kiểm tra chuẩn bị cart không thay inventory/reservations và đối chiếu rollback theo baseline T1.

W4-04 tạo cả hai cart trước khi A Complete. Baseline trước B là `t1-after-a`, không phải mốc trước A. Đây là cạnh tranh theo thứ tự, chưa phải hai HTTP requests đồng thời.

HTTP400 là expected của các ca lỗi có kiểm soát. Pass/Fail được xác định từ cả loại lỗi, trạng thái Cart/Order/Payment và kết quả inventory/reservation; không chỉ từ status code.

## 7. Tác động tồn kho và chạy lại

W4-02/W4-03 dự kiến không giữ thêm hàng sau khi hoàn tác. W4-04 có một Order A thành công và được giữ lại để review. Nếu available đầu ca là N, A giữ **N−1 đơn vị**, để lại available=1. W4-05 retry không tăng lượng giữ.

Ví dụ baseline thực tế là stocked4/reserved2/available2: sau A mua1, expected cuối suite là stocked4/reserved3/available1. Đây chỉ là ví dụ; dùng snapshot của lần chạy để kết luận.

Sau một suite thành công, fixture thường chỉ còn available1, nên một lần chạy mới sẽ không đạt preflight yêu cầu>=2. Giữ lại dữ liệu/evidence cũ. Nếu cần thử nghiệm độc lập từ baseline khác, chuẩn bị fixture riêng theo quy trình được ghi nhận, không chỉnh số tồn để ép run cũ khớp expected.

Nếu có lỗi hoặc dừng giữa chừng, **đọc manifest.json và failure.json trước**. Xem cart/order đã được tạo, state cuối và snapshot gần nhất. Dùng run ID mới không tự làm tác động lần chạy trước biến mất. Không gửi Complete lại hoặc chạy suite mới theo phỏng đoán.

## 8. Cấu trúc output

Mỗi run ghi vào thư mục mới:

`C:/demo1/EnterpriseE-commercePlatform/docs/report/evidence/inventory-week4-<run-id>/`

```text
environment.json
fixture.json
manifest.json
api-trace.json
inventory-timeline.json
inventory-timeline.csv
suite-summary.json
final-state.json                 nếu suite kết thúc thành công
failure.json                     nếu suite dừng vì lỗi
preflight/
  snapshot.json
  http/
W4-01-supplement/
  current-readback.json
  source-evidence.json
W4-02/
  cart-receipt.json
  t0.json, t1.json, t2.json
  complete-response.json
  validation.json
  http/
W4-03/
  cart-receipt.json
  t0.json, t1.json, t2.json
  complete-response.json
  validation.json
  http/
W4-04/
  a-cart-receipt.json, b-cart-receipt.json
  before-prepare.json, t0.json
  a-complete-response.json, a-order-snapshot.json
  t1-after-a.json, b-complete-response.json, t2.json
  validation-a.json, validation.json
  http/
W4-05/
  t1.json, complete-response.json, t2.json
  validation.json
  http/
source/
  check-week4-inventory.ts
  inventory-order/snapshot.ts
  week4-inventory/validation.ts
  week4-payment/service.ts
  week4-payment/index.ts
```

Các snapshot có captured_at/capture_finished_at, level/item/kho, reservations và Cart/Order/Payment links. HTTP evidence có method, URL local, request/response body đã lọc, thời gian và HTTP status. Validation ghi từng tiêu chí expected/actual cùng passed. Timeline tổng hợp Before/After cho từng case/participant.

Đọc suite-summary để xem trạng thái từng ca và manifest state cuối. Chỉ kết luận suite hoàn tất khi manifest là completed, các validation đạt và không có failure chưa xử lý. Một thư mục mới được tạo hoặc preflight_passed chưa phải là suite đã chạy xong.

## 9. Môi trường, dữ liệu riêng tư và giới hạn

- Runner chỉ cho phép backend local cố định và DB/Redis local, từ chối production; dùng cờ test trong cả backend và terminal CLI.
- HTTP metadata chỉ chọn method, URL, timestamps, status và response headers Content-Type/Date; không ghi request headers xác thực. JSON đi qua bộ lọc loại email, phone, addresses, customer, password, token, Authorization/Cookie và che các giá trị secret đã biết.
- Publishable key dùng trong bộ nhớ để gọi Store SDK, không ghi token/key vào manifest hoặc trace. Không bổ sung credentials từ .env vào gói evidence.
- Source archive lưu code đã sử dụng, không sao chép .env, database dump hoặc cấu hình chứa secret.
- Snapshot là các lần đọc service tuần tự, không nguyên tử xuyên module. Kết luận giới hạn trong lần chạy local không chủ động có tác vụ inventory khác.
- Provider manual/local simulator kiểm tra trạng thái của Medusa, không chứng minh chuyển tiền ngân hàng thật.
- W4-01 historical JSON và current-readback được giữ khác phạm vi: readback ngày mới không thay timestamp T0/T1/T2/T3 ngày cũ.
- Suite không fulfillment, hủy đơn, reset stock hoặc dọn reservation. Liệt kê Order A còn giữ hàng và tham chiếu final-state khi bàn giao.

## 10. Hai đầu ra bàn giao

1. **Inventory Edge-case Report:** báo cáo tổng có expected/actual, delta, ID giao dịch, trạng thái từng ca, giới hạn và liên kết evidence. W4-01 lấy từ dữ liệu lịch sử đã audit; các ca còn lại lấy từ run thực tế, không điền Pass từ hướng dẫn này.
2. **Inventory Test Evidence:** thư mục run mới cùng bộ 13 JSON W4-01 lịch sử, notes và source/validation/timeline. Giữ nguyên các lần chạy trước để đối chiếu.

Hướng dẫn này mô tả cách chạy và expected. Kết quả thực tế phải đọc từ manifest, suite-summary, validation và snapshot của run đã thực hiện.

## 11. Đối chiếu lại run đã có dữ liệu và hoàn tất retry

Khi run trước đã có đủ W4-02/W4-03/W4-04 và Order A, có thể dùng chế độ finish để đọc lại bằng chứng cũ, đối chiếu bằng validator hiện tại và retry chính cart A. Chế độ này không tạo cart/Order mới và không cần hai đơn vị khả dụng. Không dùng nó thay cho việc thực hiện các ca còn chưa có dữ liệu.

Ví dụ cho bộ bằng chứng đã hoàn thành ngày 05/11/2026, chạy từ root với cờ test/development đã bật và backend đang hoạt động:

```powershell
$week4ReviewId = 'review-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
npm run backend:check:inventory-week4 -- $week4ReviewId finish auto-20261105-suite-01
```

Kết quả ghi vào thư mục run mới. reviewed-source.json lưu tham chiếu/hash các response và snapshot cũ; validation gốc được giữ nguyên. Đây là kiểm chứng lại dữ liệu đã thực thi cùng một lần retry tuần tự mới, không phải chạy lại đầy đủ các nhánh checkout.

Trong lần bàn giao này, suite đầu dừng ở W4-04 vì validator chưa nhận dạng câu lỗi native “Not enough stock available…”. Sau khi sửa nhận diện và thêm unit test, run auto-20261105-verify-01 đối chiếu lại đúng các snapshot/HTTP cũ và hoàn tất retry. Xem final-assessment.json của run verification để đọc kết luận cuối; failure.json của suite đầu được giữ như lịch sử công cụ, không bị xóa.
