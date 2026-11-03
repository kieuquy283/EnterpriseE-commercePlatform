# Chạy kiểm tra inventory khi tạo Order bằng TypeScript

Script chính: [`check-inventory-order.ts`](../../apps/backend/src/scripts/check-inventory-order.ts). Medusa CLI nạp container qua `medusa exec`, script dùng Store SDK/API để tạo giỏ và checkout. Snapshot đọc qua module services và `query.graph`; không dùng SQL hoặc Docker CLI trong script TypeScript.

## Điều kiện

- Dùng dependency đã cài của repo: npm, Medusa **2.21.2**.
- PostgreSQL và Redis local đang chạy, backend tại `http://127.0.0.1:9000`.
- `apps/backend/.env` trỏ tới database local đúng dự án; không sử dụng production.
- Có fixture sẵn: `TEE-ESSENTIAL-BLK`, published, `manage_inventory=true`, `allow_backorder=false`, một inventory item, một kho, `required_quantity=1`, còn ít nhất 2 đơn vị bán được.
- Có region Vietnam/VND, Online Store, publishable API key đang hoạt động, kho thuộc kênh bán, giá, shipping option và `pp_system_default`.
- Không chạy đồng thời checkout, fulfillment hoặc tác vụ khác làm thay đổi inventory trong lần kiểm tra.

Script tận dụng dữ liệu hiện tại. Nếu thiếu điều kiện, script dừng và ghi lỗi; chuẩn bị phần dữ liệu thiếu qua workflow phù hợp rồi dùng run ID mới. Không chạy lại toàn bộ seed, reset tồn kho hoặc sửa số tồn để làm kết quả khớp.

## Lệnh chạy từ gốc repository

Khởi động hạ tầng khi cần và chạy backend trong terminal riêng:

```powershell
docker compose up -d postgres redis
npm run backend:dev
```

Kiểm tra điều kiện, chưa tạo Cart/Order:

```powershell
npm run backend:check:inventory-order -- my-preflight-01 preflight
```

Tạo **một Order thật** mua 2 đơn vị và thu bằng chứng:

```powershell
npm run backend:check:inventory-order -- my-checkout-01
```

Hoặc chạy tại `apps/backend`:

```powershell
npm run check:inventory-order -- my-checkout-02
```

Mỗi lệnh phải dùng run ID mới. Không dùng lại ID của preflight cho checkout. Script từ chối thư mục đã tồn tại, kể cả lần chạy lỗi, để tránh vô tình tạo thêm Order khi retry. Nếu dừng sau khi đã có Cart/Order, đọc `manifest.json`, `failure.json` và dữ liệu hiện có trước khi quyết định lần chạy tiếp theo.

## Bằng chứng

Thư mục đầu ra: `docs/report/evidence/inventory-order-<run_id>/`.

| File | Nội dung |
| --- | --- |
| `environment.json`, `fixture.json`, `preflight-inventory.json` | Môi trường, phiên bản, dữ liệu thực tế trước khi tạo giỏ |
| `manifest.json` | Tiến độ và ID Cart, Order, OrderItem, OrderLineItem, Payment, Reservation |
| `t0.json` | Trước tạo/thêm hàng vào giỏ |
| `t1.json` | Giỏ đủ điều kiện checkout, trước lời gọi complete |
| `completion-receipt.json` | Response checkout thành công và Order ID |
| `t2.json`, `order-api-readback.json` | Sau complete và kết quả đọc lại Order |
| `api-trace.json` | Thứ tự API, thời điểm và kết quả; không lưu header/token/payload riêng tư |
| `inventory-timeline.csv`, `validation.json` | Bảng tồn kho và kết quả đối chiếu tự động |
| `source/` | Bản lưu source chính xác của lần chạy; dùng source trong backend để chạy lại |

Tồn khả dụng tính bằng `stocked_quantity - reserved_quantity`. Đối chiếu bằng delta, không giả định lượng giữ hàng ban đầu bằng 0. Kiểm tra Order theo version hiện tại; reservation phải trỏ tới **OrderLineItem** cùng inventory item, kho và quantity × required_quantity.

Snapshot TypeScript gồm các lần đọc service tuần tự, có `captured_at` và `capture_finished_at` theo cùng đồng hồ Node.js. Chúng không nằm trong một transaction nguyên tử xuyên module; kết luận chỉ áp dụng cho lần chạy local không có tác vụ inventory đồng thời.

Order/Reservation được giữ lại để kiểm tra; mỗi lần chạy thành công giữ thêm 2 đơn vị. Script không tự capture tiền, fulfillment, hủy Order hoặc hoàn lại số tồn. Báo cáo phải ghi trạng thái thanh toán thực tế.

## Kiểm tra mã nguồn

```powershell
npm run typecheck --workspace @dtc/backend
npm run build --workspace @dtc/backend
```

Build của Medusa chạy lint theo cấu hình hiện tại. Seed tuần 2 và tài liệu task 1/2 được giữ nguyên. Script CJS cũ chỉ phục vụ các bằng chứng lịch sử; lệnh chính hiện tại sử dụng TypeScript.

Tham khảo: [Medusa — Custom CLI Scripts](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts). Chữ ký API và trường dữ liệu đã đối chiếu với source **2.21.2** cài trong repository.
