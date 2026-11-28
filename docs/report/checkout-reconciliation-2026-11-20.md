# DATA-03 — Đối soát đơn hàng, thanh toán và tồn kho

Đối chiếu FR-04/05/06, FLOW-04/05/06 và AT-01/02/03/14/15/16 tại checkpoint 20/11/2026. Checkout khởi chạy qua Store API. Các kiểm tra đọc lại đơn và dòng đơn, liên kết giỏ–đơn và đơn–thanh toán, collection/session/payment, capture/refund, fulfillment và tồn–reservation qua Medusa Query hoặc module service. [Kế hoạch DATA-03](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md) · [Truy vết yêu cầu](../03-requirements/requirements-traceability.md) · [Suite checkout](../../apps/backend/integration-tests/http/checkout-order.spec.ts)

**Kết quả** 5/5 test checkout đạt. Lint trong lượt build, build backend và typecheck đều đạt. Cơ sở Git là `896a1d59e8480fe4d77e5abefca731fc5cccc168` với bản checkout test của nhánh DATA-03/04. File bằng chứng lưu SHA-256 theo byte của file test đã chạy trên Windows, 5 kết quả Jest và 7 mốc đọc lại với ID giả lập. [Kết quả và snapshot](evidence/checkout-reconciliation-2026-11-20/readback.json)

## Môi trường và cách chạy lại

Chạy trên Windows với Node `24.22.1`, npm `11.12.1` và Medusa `2.21.2`. PostgreSQL `17.10` chạy trong container tạm với dữ liệu trên tmpfs, cổng ngẫu nhiên chỉ bind loopback. Bản sao mã dành cho lượt test không chứa cấu hình môi trường đang sử dụng. `medusaIntegrationTestRunner` tạo, migrate và khôi phục database riêng giữa các ca. `REDIS_URL` được xóa trong cấu hình suite HTTP, nên các lượt checkout chạy qua một tiến trình Medusa và cơ chế khóa cục bộ.

Đặt biến `DATABASE_URL` trỏ đến PostgreSQL cục bộ dùng riêng bằng hostname `localhost`. Đặt `DB_*` tương ứng nếu ghi đè các biến mặc định. Tài khoản test phải tạo và dọn được database riêng của runner. Đặt `DAYMARK_DATA_03_EVIDENCE=1` để xuất các dòng `DATA-03` với ID giả lập và trạng thái đọc lại. Từ gốc repo, chạy lệnh sau.

```sh
npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/checkout-order.spec.ts
```

Ca tranh tồn chuẩn bị 20 giỏ độc lập với một đơn vị `TEE-ESSENTIAL-BLK` mỗi giỏ, cùng biến thể, cùng kho. Sau khi kiểm tra cả 20 giỏ đã sẵn sàng và tồn vẫn là 5, suite gửi 20 yêu cầu complete cùng lúc và đối chiếu kết quả với toàn bộ bản ghi test. Ca gửi lặp gửi đồng thời hai yêu cầu cùng giỏ, chụp trạng thái rồi gửi lại một lần nữa.

## Kỳ vọng và kết quả

| Ca kiểm | Kỳ vọng | Kết quả đọc lại |
| --- | --- | --- |
| Simulator thành công · AT-01/14 | Một đơn `pending` liên kết đúng giỏ và collection, một payment đã authorize, chưa capture. Tồn vật lý giữ nguyên và có một reservation cho dòng đơn. | **PASS.** Một đơn và một payment. Authorize 279.000 ₫, capture 0. Tồn vật lý 25, giữ chỗ từ 0 lên 1. Chưa tạo fulfillment. |
| Simulator từ chối · AT-02/14 | Không sinh đơn, liên kết, payment hoặc reservation. Tồn giữ nguyên và session thể hiện thất bại. | **PASS.** HTTP 400, session `error`, collection `not_paid`. Không có bản ghi đơn hoặc payment. Tồn vật lý 25, giữ chỗ 0. |
| Hủy trước fulfillment · AT-16 | Đơn có trạng thái `canceled`. Reservation được trả, tồn vật lý giữ nguyên. | **PASS.** Đơn, collection và payment được hủy. Tồn vật lý 25, giữ chỗ từ 1 về 0. Có dấu vết liên kết đơn và thanh toán, capture và refund đều 0. |
| Gửi lại cùng giỏ · AT-03 | Một đơn, một payment và một reservation. Lần gửi lại đọc được cùng mã đơn và toàn bộ readback giữ nguyên. | **PASS.** Hai yêu cầu đồng thời và lần gửi lại đều HTTP 200, cùng mã đơn. Chỉ có một payment và một reservation. Snapshot sau lần gửi lại trùng snapshot trước đó. |
| 20 lượt checkout tranh 5 đơn vị · AT-15 | 5 đơn được nhận và 15 lượt từ chối do hết tồn. 5 reservation đúng dòng đơn, tồn vật lý 5, giữ chỗ 5, khả dụng 0. Các lượt từ chối không để lại đơn hoặc payment. | **PASS.** 5 mã đơn khác nhau, 5 payment đã authorize và 5 reservation. 15 lượt trả HTTP 400 vì hết tồn. Với 15 giỏ đó, session còn `pending`, không có payment, order hay reservation. Tồn vật lý 5, giữ chỗ 5, khả dụng 0. |
| Đặt COD và capture kỹ thuật · AT-14 | Tạo đơn COD chỉ authorize. Capture qua workflow native tạo bản ghi thanh toán kỹ thuật riêng. | **PASS kỹ thuật.** Khi đặt đơn, authorize 279.000 ₫ và chưa capture. Sau `capturePaymentWorkflow`, collection `completed` và có một capture 279.000 ₫. Giữ nguyên đơn, tồn và reservation, chưa tạo fulfillment. |

## Sai lệch và việc còn mở

- **Trạng thái sau khi hủy.** Session vẫn mang `authorized` sau khi payment và collection đã hủy. Đối soát dùng `payment.canceled_at` cùng trạng thái collection và mức capture. Trong lượt chạy, authorize 279.000 ₫ còn được lưu để truy vết.
- **Gửi lại sau timeout và nhiều tiến trình.** Ca retry gửi lặp cùng giỏ trong một tiến trình, gồm một lần sau khi yêu cầu trước đã trả về. Chưa kiểm timeout ở phía khách, nội dung giỏ đổi hoặc khóa Redis giữa các tiến trình. Hoàng và Quân đối chiếu trên bản tích hợp khi `OPEN-RETRY-001` và phạm vi nghiệm thu được chốt. [Sổ giả định và quyết định](../00-project/source-and-assumption-register.md) · [ADR nhất quán đơn và tồn kho](../06-architecture/adr/ADR-003-order-inventory-consistency.md)
- **Xác nhận thu COD thuộc vận hành.** Medusa ghi authorize và capture. Xác nhận thu cần nguồn bằng chứng của quy trình Staff được duyệt và đối chiếu đúng đơn, số tiền và người xác nhận. Hoàng và Quân còn cần chạy ca Staff từ giao hàng đến ghi nhận COD. [Quy tắc thanh toán](../01-business/business-rules.md) · [Ma trận quyền Staff/Admin](../technical/staff-admin-permission-matrix.md) · [Định nghĩa COD DATA-04](../technical/reporting-data-definitions.md#thu-cod)

Lượt chuẩn bị dùng địa chỉ `127.0.0.1` khiến Medusa Test Utils chọn SSL cho PostgreSQL test. Chuyển hostname kết nối sang `localhost` cho lượt đạt. Hai địa chỉ dùng cùng phạm vi loopback của máy cục bộ.
