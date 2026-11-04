# Inventory Edge-case Report — Báo cáo tuần 4

**Hoàn thành phạm vi tuần 4: 4/4 ca chính Pass; ca bổ sung W4-05 Pass.** Checkout thành công giữ đúng lượng hàng; capture không giữ thêm hàng; thanh toán bị từ chối, checkout thiếu shipping và checkout thiếu hàng đều bảo toàn inventory/reservation theo baseline của ca. Đơn hàng chưa fulfillment.

Báo cáo kết hợp bằng chứng W4-01 ngày **01/11/2026** với các ca tự động và readback bổ sung ngày **05/11/2026, UTC+07 (Asia/Saigon)**. Bộ validation cuối cho W4-02–W4-05 đạt **40/40 tiêu chí** (12+11+10+7); riêng việc đặt hàng thành công của A trong W4-04 đạt **11/11** tiêu chí. W4-01 lịch sử cũng được audit 10/10 tiêu chí. Kết quả này không bao gồm kiểm thử ngân hàng thật hoặc hai request checkout đồng thời.

## 1. Phạm vi và nguồn bằng chứng

| Bộ dữ liệu | Thời gian / vai trò | Nguồn |
| --- | --- | --- |
| W4-01 lịch sử | Order tạo 21:15:17.840, payment captured 21:35:00.375 ngày 01/11/2026 UTC+07; 13 response JSON | [Evidence W4-01](evidence/historical-w4-01/) |
| auto-20261105-suite-01 | Bắt đầu 2026-11-05 02:41:48.606 UTC+07; thực thi thật W4-02/W4-03/W4-04; dừng 2026-11-05 02:42:02.023 UTC+07 vì validator không nhận diện một cách diễn đạt lỗi thiếu hàng | [Manifest gốc](evidence/run-20261105/manifest.json), [HTTP trace gốc](evidence/run-20261105/api-trace.json) |
| auto-20261105-verify-01 | 2026-11-05 02:44:25.933 UTC+07 → 2026-11-05 02:44:28.585 UTC+07; đánh giá lại snapshots đã lưu và thực hiện retry W4-05 | [Manifest completed](evidence/verification-20261105/manifest.json), [Suite summary cuối](evidence/verification-20261105/suite-summary.json) |

Lần verification giữ nguyên các response, snapshots và validation ban đầu; không tạo lại các cart W4-02/W4-03/W4-04, không reset stock và không tạo Order A thứ hai. W4-05 gửi lại Complete đúng cart A đã thành công. Các hash nguồn được lưu để truy vết việc đánh giá lại.

## 2. Môi trường và fixture

| Thuộc tính | Actual |
| --- | --- |
| Backend API | http://127.0.0.1:9000, local/development |
| Medusa / SDK / Framework / Core Flows / Inventory / Order / Payment | Đều 2.21.2, đọc từ package cài đặt của tiến trình CLI ngày 05/11 |
| Node của CLI | v24.21.0 |
| Provider test | pp_week4_local, bật bằng WEEK4_INVENTORY_TESTS=true; cùng pp_system_default được region cho phép |
| SKU / handle | W4-INVENTORY-TEST / week4-inventory-test |
| Product ID | prod_01M6BG5WR38CA1QKCZ90XES8CE |
| Variant ID | variant_01M6BG5WXFHR6XZKDHRZCENMNW |
| Inventory item / level | iitem_01M6BG5WYG10RW1DN1Q5RWJDM0 / ilev_01M6BG8PDBJFPWTSJK3JG0E7MA |
| Kho / location | Vietnam Warehouse / sloc_01M5555A4F96W5XBT8FJGE2EG4 |
| Region / sales channel | reg_01M5555A2ZAPR5SYW3THXG2SVC / sc_01M5555A0N5T656VFQ874BGK26 |
| manage_inventory / allow_backorder / required_quantity | true / false / 1, xác minh cấu hình hiện tại ngày 05/11 |
| Giá đơn vị | 249000 VND |
| Baseline đầu lượt tự động | Stocked4 / reserved2 / incoming0 / available2; sử dụng dữ liệu sẵn có |
| Cách đọc | Module services + query.graph; snapshot đọc tuần tự, có captured_at và capture_finished_at |

Nguồn: [Environment](evidence/run-20261105/environment.json), [Fixture](evidence/run-20261105/fixture.json), [Preflight snapshot](evidence/run-20261105/preflight/snapshot.json). Version/runtime ngày 05/11 không được gán lại làm manifest lịch sử của W4-01. Không chạy lại seed tuần 2/3 hoặc đặt lại tồn để thu kết quả này.

## 3. Tổng hợp kết quả

| Case | Tình huống | Expected / actual chính | Kết quả | Validation |
| --- | --- | --- | --- | --- |
| W4-01 | Checkout quantity2, authorize rồi capture | 4/0/4 → 4/2/2 sau checkout; capture đủ528000 VND, inventory/reservation giữ nguyên | Pass | [13 JSON và notes](evidence/historical-w4-01/notes.txt) |
| W4-02 | Provider từ chối authorize | HTTP400 not_allowed; session error; cart chưa completed, active Order link rỗng; 4/2/2 → 4/2/2 | Pass | [12/12](evidence/verification-20261105/W4-02/validation.json) |
| W4-03 | Checkout thiếu shipping | HTTP400 invalid_data đúng lỗi shipping; không tăng reservation hoặc tạo active Order; 4/2/2 → 4/2/2 | Pass | [11/11](evidence/verification-20261105/W4-03/validation.json) |
| W4-04 | A mua1, B mua2; hai cart chuẩn bị khi available2 | A thành công 4/2/2 → 4/3/1; B thiếu hàng, giữ nguyên 4/3/1 và reservation của A | Pass | [B: 10/10](evidence/verification-20261105/W4-04/validation.json); [A: 11/11](evidence/verification-20261105/W4-04/validation-a.json) |
| W4-05, bổ sung | Complete lại cart A đã thành công | HTTP200, cùng Order ID; inventory/reservations, số Order và Payment không tăng | Pass | [7/7](evidence/verification-20261105/W4-05/validation.json) |

HTTP400 của các ca lỗi có kiểm soát là expected. Đánh giá Pass dựa trên đúng loại lỗi và dữ liệu sau compensation, không chỉ status code. Bốn ca chính: **4 Pass, 0 Fail, 0 Blocked, 0 Not run**; ca bổ sung W4-05 Pass.

## 4. Inventory Before/After

Đối chiếu cùng inventory item và location ở mục 2; available = stocked − reserved. Δ trong bảng theo thứ tự stocked/reserved/available. Incoming không đổi, bằng0.

| Case | Mốc | Thời điểm bắt đầu snapshot | Stocked | Reserved | Incoming | Available | Đối chiếu |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| W4-01 | T0/T1 lịch sử | Chưa lưu timestamp chụp riêng ngày01/11 | 4 | 0 | 0 | 4 | Baseline W4-01 |
| W4-01 | T2 sau checkout | Chưa lưu timestamp chụp riêng ngày01/11 | 4 | 2 | 0 | 2 | Δ=0/+2/−2 |
| W4-01 | T3 sau capture | Chưa lưu timestamp chụp riêng ngày01/11 | 4 | 2 | 0 | 2 | Δcapture=0/0/0 |
| W4-02 | T1 trước Complete | 2026-11-05 02:41:52.582 UTC+07 | 4 | 2 | 0 | 2 | Baseline W4-02 |
| W4-02 | T2 sau lỗi/compensation | 2026-11-05 02:41:53.666 UTC+07 | 4 | 2 | 0 | 2 | Δ=0/0/0 |
| W4-03 | T1 trước Complete | 2026-11-05 02:41:55.239 UTC+07 | 4 | 2 | 0 | 2 | Baseline W4-03 |
| W4-03 | T2 sau lỗi validation | 2026-11-05 02:41:55.706 UTC+07 | 4 | 2 | 0 | 2 | Δ=0/0/0 |
| W4-04 | T0 trước A Complete | 2026-11-05 02:42:00.254 UTC+07 | 4 | 2 | 0 | 2 | Baseline trước A |
| W4-04 | Sau A thành công | 2026-11-05 02:42:00.982 UTC+07 | 4 | 3 | 0 | 1 | ΔA=0/+1/−1 |
| W4-04 | T1 sau A, trước B | 2026-11-05 02:42:01.127 UTC+07 | 4 | 3 | 0 | 1 | Baseline của B |
| W4-04 | T2 sau B thất bại | 2026-11-05 02:42:01.833 UTC+07 | 4 | 3 | 0 | 1 | ΔB=0/0/0 |
| W4-05 | T1 trước retry A | 2026-11-05 02:44:27.659 UTC+07 | 4 | 3 | 0 | 1 | Baseline retry |
| W4-05 | T2 sau retry A | 2026-11-05 02:44:28.429 UTC+07 | 4 | 3 | 0 | 1 | Δ=0/0/0 |

Các mốc ngày05/11 ở bảng là captured_at; khoảng đọc đầy đủ và từng Cart/Order ID có trong [timeline gốc](evidence/run-20261105/inventory-timeline.csv) và [timeline verification/retry](evidence/verification-20261105/inventory-timeline.csv). Với B, baseline là sau A, không so sau B trực tiếp với mốc trước A. W4-02/W4-03 cũng xác minh T0→T1 không đổi trong lúc chuẩn bị checkout.

## 5. W4-01 — thành công và capture

Bộ lịch sử trả type=order, cùng SKU/variant và quantity2 qua Complete, Store Order và Admin Order. Tổng tiền là 2×249000 + shipping30000 = **528000 VND**, tax0. Sau checkout, payment authorized và captured_amount0; sau capture, payment_status=captured, collection completed, một capture528000 trên cùng Payment. Inventory và reservation T3 giống T2.

| Thành phần | ID / actual |
| --- | --- |
| Cart | cart_01M6BMW62AQK90ATJ2PY9FAXDC |
| Order / version | order_01M6BQDX2ADNG6PFVZ8GFYG3A5 / 1 |
| OrderLineItem / OrderItem detail | ordli_01M6BQDX2DF1Q95VFKD6FCG8G0 / orditem_01M6BQDX2E8VQ47C67QG1QQ9D4 |
| Reservation | resitem_01M6BQDX722CH5K78236NA4WBJ, quantity2, line_item_id khớp OrderLineItem |
| Payment collection | pay_col_01M6BPD7B3GEVRPRT3DK8PQKDB |
| Payment session / Payment | payses_01M6BQ03DVF9R8M2RGCCDE2VBQ / pay_01M6BQDX9YKMVRC3ZCRTT01A78 |
| Capture | capt_01M6BRHZW57WE3KPM7MN9QTZ89, amount528000 |
| Payment captured_at | 2026-11-01 21:35:00.375 UTC+07 |

Nguồn lịch sử: [Complete](evidence/historical-w4-01/complete-response.json), [Admin trước capture](evidence/historical-w4-01/t2-admin-order.json), [Capture](evidence/historical-w4-01/capture-response.json), [Admin sau capture](evidence/historical-w4-01/t3-admin-order.json). Pagination reservations lịch sử đầy đủ: offset0, count0 hoặc1, số dòng bằng count.

Cart–Order link nay đã được xác minh qua [readback bổ sung](evidence/run-20261105/W4-01-supplement/current-readback.json) tại 2026-11-05 02:41:49.242 UTC+07. Cart completed_at là 2026-11-01 21:15:17.943 UTC+07. Đây là readback mới của dữ liệu hiện tại, không tái tạo thời điểm chụp T0/T1/T2/T3 cũ. Hash của 13 JSON lịch sử nằm trong [source evidence](evidence/run-20261105/W4-01-supplement/source-evidence.json).

## 6. W4-02 — provider từ chối authorize

Cart mới quantity2 có đủ địa chỉ, shipping và payment session của pp_week4_local với outcome fail. Initiate session thành công/pending; khi Complete gọi authorize, provider trả ERROR.

- Cart: cart_01M6M19YR4YJ2JRRRNQ4P81JEA.
- Payment collection: pay_col_01M6M1A1CVN41HW6K7DD9D4HMA.
- Payment session: payses_01M6M1A1GTA0AC410NJ0S8CPDY.
- HTTP actual: 400, type=not_allowed.
- Message actual: Session: payses_01M6M1A1GTA0AC410NJ0S8CPDY was not authorized with the provider.
- Sau lỗi: session error, authorized_at=null; collection not_paid, authorized/captured/refunded amount đều0; không Payment hoặc capture mới.
- Cart completed_at=null, active Order links rỗng; active Order count không tăng.
- Inventory T1/T2 cùng4/2/2; reservation cũ quantity2 còn nguyên ID và nội dung, không để lại reservation của attempt lỗi.

Nguồn: [Response Complete](evidence/run-20261105/W4-02/complete-response.json), [T1](evidence/run-20261105/W4-02/t1.json), [T2 sau compensation](evidence/run-20261105/W4-02/t2.json), [Validation cuối](evidence/verification-20261105/W4-02/validation.json). Kết quả **Pass, 12/12**.

## 7. W4-03 — checkout thiếu shipping

Cart quantity1 có địa chỉ và payment session của pp_system_default, cố ý chưa thêm shipping method. Đây là lỗi validation trước khi hoàn tất checkout.

- Cart: cart_01M6M1A2VMG5K3V1DVMRA76HHQ.
- HTTP actual: 400, type=invalid_data.
- Message actual: No shipping method selected but the cart contains items that require shipping.
- Sau lỗi: cart chưa completed, không active Order link; session vẫn pending và chưa tạo Payment/capture.
- Inventory T1/T2 cùng4/2/2; reservation cũ giữ nguyên, không phát sinh reservation còn tồn tại của cart lỗi.

Nguồn: [Response Complete](evidence/run-20261105/W4-03/complete-response.json), [T1](evidence/run-20261105/W4-03/t1.json), [T2](evidence/run-20261105/W4-03/t2.json), [Validation cuối](evidence/verification-20261105/W4-03/validation.json). Kết quả **Pass, 11/11**.

## 8. W4-04 — thiếu hàng tại Complete

Khi available2, runner chuẩn bị đầy đủ cả cart A quantity1 và cart B quantity2 trước khi Complete A. A thành công, giữ1 đơn vị và để available1. Sau đó B Complete quantity2 bị chặn vì thiếu hàng. Đây là cạnh tranh theo thứ tự; chưa phải hai request đồng thời.

| Thành phần | Actual |
| --- | --- |
| Cart A / quantity | cart_01M6M1A4SWS7X4QQKQPRRT8PJV / 1 |
| Order A / OrderLineItem | order_01M6M1A9C6KA58YT5JKRG580V4 / ordli_01M6M1A9C7NZQQG2W6VTH2P8E8 |
| Reservation mới của A | resitem_01M6M1A9FC5QHNJ3FT34D505QD, quantity1 |
| Payment A | pay_01M6M1A9HA54Z64J4AE5XK4V9D, authorized279000 VND, captured_at=null |
| Cart B / quantity | cart_01M6M1A6XFE6Y3FWYKSWXTZZ66 / 2 |
| Response B | HTTP400, type=not_allowed |
| Message B | Not enough stock available for item iitem_01M6BG5WYG10RW1DN1Q5RWJDM0 at location sloc_01M5555A4F96W5XBT8FJGE2EG4 |

Sau A: stocked4/reserved3/available1; reservation lịch sử quantity2 và reservation A quantity1 đều tồn tại đúng IDs. Sau B: cùng4/3/1, cả hai reservation vẫn nguyên vẹn, B chưa completed và không active Order link hoặc Payment/capture mới. Kết quả **Pass**; A11/11, B10/10.

Nguồn: [A Complete](evidence/run-20261105/W4-04/a-complete-response.json), [A snapshot](evidence/run-20261105/W4-04/a-order-snapshot.json), [Baseline sau A](evidence/run-20261105/W4-04/t1-after-a.json), [B Complete](evidence/run-20261105/W4-04/b-complete-response.json), [Sau B](evidence/run-20261105/W4-04/t2.json), [Validation A](evidence/verification-20261105/W4-04/validation-a.json), [Validation B cuối](evidence/verification-20261105/W4-04/validation.json).

### Sai lệch validator ban đầu và cách xử lý

Lần auto-20261105-suite-01 dừng khi validator W4-04 chỉ đạt **9/10**. Tiêu chí không đạt là expected_checkout_error: matcher cũ nhận các chuỗi về inventory/insufficient stock nhưng thiếu cách diễn đạt native **Not enough stock available**. HTTP400 và các kiểm tra rollback, Cart/Order, inventory/reservation đều đúng ở bằng chứng gốc.

Đã sửa matcher nhận đúng thông báo native này, bổ sung unit test và đánh giá lại chính snapshots/response đã lưu trong auto-20261105-verify-01. Không thay body lỗi, không sửa snapshot, không reset stock hoặc tạo lại Order A. Validation cuối B đạt10/10.

Dấu vết ban đầu giữ nguyên: [Failure gốc](evidence/run-20261105/failure.json), [Validation gốc 9/10](evidence/run-20261105/W4-04/validation.json). Đối chiếu mới: [Reviewed source và SHA256](evidence/verification-20261105/reviewed-source.json), [Validation cuối 10/10](evidence/verification-20261105/W4-04/validation.json). Đây là lỗi nhận diện của công cụ kiểm chứng đã được sửa, không phải lỗi nghiệp vụ inventory quan sát được.

## 9. W4-05 — retry cart A

Gửi Complete lại đúng cart A cart_01M6M1A4SWS7X4QQKQPRRT8PJV. Response HTTP200, type=order, Order ID vẫn order_01M6M1A9C6KA58YT5JKRG580V4. Snapshot trước/sau retry cùng4/3/1, reservation giữ nguyên; số active Order và Payment không tăng, Cart–Order link không đổi. Kết quả **Pass, 7/7**.

Nguồn: [Retry response](evidence/verification-20261105/W4-05/complete-response.json), [Trước retry](evidence/verification-20261105/W4-05/t1.json), [Sau retry](evidence/verification-20261105/W4-05/t2.json), [Validation retry](evidence/verification-20261105/W4-05/validation.json). Đây là retry tuần tự trên cùng cart, không xác nhận checkout đồng thời.

## 10. Kiểm tra mã nguồn và khả năng chạy lại

| Kiểm tra | Kết quả |
| --- | --- |
| Unit tests cho validator | 17/17 đạt |
| Backend TypeScript typecheck | Đạt |
| Backend lint | Đạt, 0 lỗi/0 cảnh báo |
| Backend build cuối | Đạt (exit0), gồm build backend và Admin |

Nguồn kiểm tra mã: [code-validation.json](evidence/verification-20261105/code-validation.json), ghi exit0 cho typecheck/build, 17/17 unit tests, lint0 lỗi/0 cảnh báo và SHA256 của 5 source hiện tại khớp archive. Unit tests kiểm tra công cụ validation; các kết luận nghiệp vụ vẫn dựa trên HTTP/snapshots live.

Runner và provider/snapshot/validator của từng lần được archive trong source của [run gốc](evidence/run-20261105/source/) và [run verification](evidence/verification-20261105/source/). Cách gọi, điều kiện môi trường và tác động giữ hàng được ghi trong [Hướng dẫn chạy tự động](run-guide.md).

Fixture hiện chỉ còn available1 nên không chạy lại toàn bộ suite với yêu cầu ban đầu>=2 theo phỏng đoán. Đọc manifest/failure/final-state trước khi quyết định một lần thử mới; việc đổi run ID không hoàn tác tác động cũ.

## 11. Inventory Test Evidence bàn giao

| Nhóm | File/thư mục |
| --- | --- |
| W4-01 lịch sử, 13 JSON + notes | [W4-01](evidence/historical-w4-01/) |
| Môi trường, fixture và HTTP thật W4-02–W4-04 | [Run gốc](evidence/run-20261105/), [Environment](evidence/run-20261105/environment.json), [API trace](evidence/run-20261105/api-trace.json) |
| Before/After toàn bộ case gốc | [Timeline CSV](evidence/run-20261105/inventory-timeline.csv), [Timeline JSON](evidence/run-20261105/inventory-timeline.json) |
| Readback Cart–Order của W4-01 | [Supplement](evidence/run-20261105/W4-01-supplement/current-readback.json) |
| Bằng chứng sự cố matcher ban đầu | [Failure](evidence/run-20261105/failure.json), [Validation gốc](evidence/run-20261105/W4-04/validation.json) |
| Validation cuối và retry W4-05 | [Run verification completed](evidence/verification-20261105/), [Summary](evidence/verification-20261105/suite-summary.json), [Manifest](evidence/verification-20261105/manifest.json) |
| Hash nguồn đánh giá lại | [Reviewed source](evidence/verification-20261105/reviewed-source.json) |
| Đánh giá tổng và kiểm tra source | [Final assessment](evidence/verification-20261105/final-assessment.json), [W4-01 audit10/10](evidence/verification-20261105/W4-01-supplement/historical-validation.json), [Code validation](evidence/verification-20261105/code-validation.json), [README evidence](evidence/verification-20261105/README.md) |
| Trạng thái cuối và dữ liệu còn giữ | [Final state](evidence/verification-20261105/final-state.json) |

HTTP evidence chọn method, URL local, timestamps, status và response headers Content-Type/Date, không ghi request Authorization/Cookie/API key. Các JSON mới đã lọc email/phone/address/customer và secret/token. Không sao chép .env hoặc credentials vào bộ bàn giao. Các snapshots đọc services không dùng raw SQL để tạo/sửa nghiệp vụ.

## 12. Giới hạn và dữ liệu sau kiểm thử

- W4-01 dùng manual/system provider; W4-02 dùng provider mô phỏng local. Authorization/capture ở đây xác nhận dữ liệu và luồng Medusa, không đối soát chuyển tiền ngân hàng thật.
- Tất cả Order vẫn chưa fulfillment. Không kiểm tra trừ stocked khi xuất hàng, refund/return, backorder, bundle hoặc nhiều kho.
- Các snapshot là đọc tuần tự xuyên module, không transaction nguyên tử; không chủ động chạy tác vụ inventory ngoài bài thử đồng thời.
- W4-04/W4-05 xác minh cạnh tranh theo thứ tự và retry tuần tự; không suy rộng thành kết quả của hai Complete requests cùng lúc.
- W4-01 lịch sử chưa có HTTP/request metadata và timestamp chụp riêng; readback ngày05/11 bổ sung Cart–Order link và cấu hình hiện tại, không dựng lại dữ liệu đo ngày01/11.
- Required_quantity=1 và runtime phiên bản2.21.2/Nodev24.21.0 được xác minh ở tiến trình ngày05/11; không coi đó là manifest runtime lịch sử của W4-01.
- Sau kiểm thử, tồn của fixture là **stocked4 / reserved3 / incoming0 / available1**. Reservation cũ quantity2 thuộc Order order_01M6BQDX2ADNG6PFVZ8GFYG3A5, đã captured528000 VND; reservation mới quantity1 thuộc Order A order_01M6M1A9C6KA58YT5JKRG580V4, authorized279000 VND, chưa capture. Cả hai giữ lại để review, không tự hủy, fulfillment, reset tồn hoặc dọn reservation.

## 13. Kết luận

Phạm vi task tuần 4 đã có bằng chứng cho Inventory khi checkout/thanh toán thành công và thất bại, Reservation khi checkout lỗi hoặc thiếu hàng, cùng Inventory Before/After. **Bốn ca chính đều Pass; ca retry bổ sung Pass.** Không phát hiện bất nhất nghiệp vụ inventory/reservation trong phạm vi local một variant/item/kho chưa fulfillment. Toàn bộ dấu vết lỗi matcher của lần kiểm chứng đầu được giữ nguyên và liên kết cùng kết quả xác minh cuối.
