# Evidence — inventory checkout bằng TypeScript

Run ID: **`ts-20261026-order-01`**. Script TypeScript chạy qua `medusa exec` ngày **26/10/2026, 16:03:56.261–16:04:01.151 UTC+07**. Checkout tạo Order thật `order_01M5VQ7KFZJNCP690YV4PV8VQF`; **24/24 kiểm tra đạt**.

Báo cáo chính: [Inventory Consistency Notes](../../inventory-consistency-notes.md).

| File | Nội dung |
| --- | --- |
| [environment.json](environment.json) | Môi trường local, phiên bản Medusa/SDK/modules/Node, cách đọc snapshot |
| [fixture.json](fixture.json) | Variant/SKU/item/kho, quản lý inventory/backorder, required quantity, giá và provider |
| [preflight-inventory.json](preflight-inventory.json) | Kiểm kê fixture và tồn ban đầu trước tạo cart |
| [manifest.json](manifest.json) | Run ID, trạng thái hoàn tất, Cart/Order/OrderItem/OrderLineItem/Payment/Reservation IDs |
| [api-trace.json](api-trace.json) | Lời gọi Store SDK/API theo thứ tự, thời điểm bắt đầu/kết thúc và kết quả |
| [t0.json](t0.json) | Trước tạo cart: stocked 25, reserved 4, incoming 0, available 21 |
| [t1.json](t1.json) | Sau chuẩn bị checkout, trước complete: 25 / 4 / 0 / 21 |
| [t2.json](t2.json) | Sau nhận Order ID: 25 / 6 / 0 / 19; liên kết giao dịch |
| [inventory-timeline.csv](inventory-timeline.csv) | T0/T1/T2 và khoảng thời gian đọc cùng item/kho |
| [completion-receipt.json](completion-receipt.json) | Response checkout `type=order` và Order ID |
| [order-api-readback.json](order-api-readback.json) | Store API đọc lại Order: version 1, đúng variant, quantity 2 |
| [validation.json](validation.json) | 24 kiểm tra expected/actual, `all_passed=true` |
| [code-validation.json](code-validation.json) | Typecheck/build/lint và đối chiếu SHA ba source thực thi |
| [source/check-inventory-order.ts](source/check-inventory-order.ts) | Bản script thực thi được lưu trước T0 |
| [source/inventory-order/snapshot.ts](source/inventory-order/snapshot.ts) | Helper đọc snapshot qua module services/query.graph |
| [source/inventory-order/validation.ts](source/inventory-order/validation.ts) | Logic đối chiếu kết quả |

Fixture mua **2** đơn vị `TEE-ESSENTIAL-BLK`, `manage_inventory=true`, `allow_backorder=false`, một inventory item tại một kho, `required_quantity=1`. Dữ liệu nền đủ nên không chạy seed/reset. Order và reservation mới phát sinh qua checkout của lần chạy này.

T0/T1 có hai reservation tổng quantity 4; cả hai giữ nguyên tại T2. Reservation mới `resitem_01M5VQ7KMDW25KAQRVJ64B8JD9` có quantity 2, `line_item_id=ordli_01M5VQ7KG16VN1187M4X1X2HJ1`, đúng item/kho. Hai level khác giữ nguyên.

Payment collection/session T2 **authorized**, amount **528,000 VND**. Captured/refunded amount đều 0, Payment `captured_at=null`, không capture/refund/fulfillment. Order mới vẫn giữ thêm 2 đơn vị để review; không tự hủy hoặc chỉnh tồn sau thử nghiệm.

`captured_at`/`capture_finished_at` là khoảng đọc theo đồng hồ Node.js host, lưu UTC (`Z`). Snapshot gồm các lần đọc tuần tự qua service/query, **không phải transaction nguyên tử xuyên module**; không dùng để khẳng định an toàn khi checkout đồng thời. Timestamp trong bản ghi database thuộc nguồn dữ liệu khác.

`source/` lưu source đúng thời điểm chạy. Chạy lại từ repository bằng `npm run backend:check:inventory-order -- <run-id-moi>`; không chạy trực tiếp bản trong evidence vì đường dẫn cấu hình/evidence phụ thuộc vị trí source backend. Mỗi run đầy đủ tạo Order mới, giữ thêm hàng và yêu cầu run ID chưa dùng. Xem hướng dẫn/giới hạn trong báo cáo chính.

Không lưu token, secret, password, connection string, payload provider hoặc địa chỉ/email checkout trong evidence.
