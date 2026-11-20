# ADR-004 — Trạng thái thanh toán và COD

- **Ngày:** 2026-11-20. **Trạng thái:** Proposed, chưa được chấp thuận. **Người quyết định:** chủ nghiệp vụ/kiến trúc (chưa phân công).
- **Bối cảnh:** Checkout phải phân biệt nhận đơn, cho phép thanh toán, thu tiền và giao hàng. COD chưa được thu khi khách đặt; simulator không chuyển tiền. [PROC-PAY-001](../../01-business/business-processes.md), [RULE-PAY-001/002](../../01-business/business-rules.md), [FR-04/05](../../spec/01-business.md), [IF-PAY-001](../api-and-interface-contracts.md).

## Quyết định đề xuất

1. **Medusa sở hữu cart, payment collection/session, payment, order, inventory và fulfillment.** Checkout tiếp tục dùng Store API/workflow lõi đã cài; không thêm bảng đơn/thanh toán hoặc controller bọc API lõi.
2. **COD production dùng `pp_system_default`; simulator chỉ ở ngoài production.** Cấu hình bỏ simulator khi `NODE_ENV=production` và constructor của provider từ chối khởi chạy trong production. Không dùng simulator để nghiệm thu demo production.
3. **`authorized` không có nghĩa là đã thu.** Thành công của simulator chỉ cho phép hoàn tất đơn. COD cũng tạo đơn chưa thu. Chỉ được xem `captured` là đã ghi nhận thu khi thao tác capture được người có quyền thực hiện sau khi xác minh; trạng thái Medusa tự nó không lưu bằng chứng thu. Thao tác Staff và bằng chứng đối soát thuộc BE-05, chưa được ADR này nghiệm thu.
4. **Không tự capture hoặc tạo fulfillment khi hoàn tất giỏ.** Order được nhận không đồng nghĩa đã thu, đóng gói, bàn giao hoặc shipped. Thành công phải giữ payment state chưa captured và fulfillment `not_fulfilled` đến khi có thao tác riêng hợp lệ.
5. **Lỗi simulator không được thành công giả.** Provider chỉ nhận `simulated_outcome` kiểu boolean; kết quả thất bại làm complete bị từ chối, không tạo order hợp lệ hoặc giữ chỗ tồn. Phản hồi/log chỉ dùng lỗi chung an toàn và mã phiên cần điều tra; không ghi payload đầu vào, địa chỉ, email hoặc dữ liệu provider.
6. **Dùng idempotency hiện có của Medusa, không tuyên bố exactly-once.** Store API của Medusa 2.21.2 trả collection đã liên kết với cart khi lệnh tạo collection lặp lại; workflow lõi từ chối tạo lần nữa nếu được gọi trực tiếp với cart đã có collection. Tạo payment session lặp lại thay phiên trước đó theo chính sách một session cho collection, không hỗ trợ split payment. Khi kết quả request chưa rõ, đọc lại cart/collection/order trước khi thử; timeout sau commit, complete đồng thời và đối soát intent thuộc BE-03.
7. **Tổng tiền lấy từ server.** Giá, phí giao và tổng collection/order phải khớp snapshot checkout theo currency VND; client không gửi tổng tiền làm nguồn có thẩm quyền.

## Hệ quả và giới hạn

- Checkout simulator thành công có thể có collection `authorized`, một order với tổng đúng và tồn được reserve; đây chưa phải bản ghi tiền đã thu.
- Simulator thất bại cần xác minh cả liên kết order-cart và snapshot inventory, không chỉ HTTP status. Lỗi API nên giữ thông điệp an toàn; log framework có thể chứa payment-session ID để đối soát nhưng không payload khách/provider.
- COD dùng `pp_system_default` để kiểm luồng Store API. Đây không chứng minh quy trình Staff xác minh tiền mặt, quyền capture, hoặc đối soát hãng vận chuyển.
- Kiểm tra một session còn hoạt động sau khi lặp thao tác không chứng minh idempotency khi hai request đồng thời. Ma trận timeout, concurrency, payload khác nhau và SKU cuối vẫn cần kiểm tra riêng ở BE-03.
- Đơn tồn tại không đủ chứng minh fulfillment. Không phát trạng thái shipped khi chưa có fulfillment/bằng chứng bàn giao.

## Kiểm chứng

`apps/backend/integration-tests/http/checkout-order.spec.ts` kiểm luồng simulator thành công/thất bại, COD qua provider mặc định, tổng tiền và currency, trạng thái authorized/chưa captured, fulfillment chưa tạo, từ chối dữ liệu simulator sai, collection lặp trả cùng ID với một cart-payment link, và session thay thế không nhân bản session đang hoạt động. Chạy trên PostgreSQL tích hợp dùng riêng; kết quả theo từng lần chạy được ghi ở đầu ra công cụ/CI, không coi ADR này là báo cáo PASS.

**Xem lại khi:** chốt người sở hữu chính sách COD/capture, tích hợp payment provider thật, cần split payment, hoặc có bằng chứng Medusa core không đáp ứng yêu cầu retry/concurrency của BE-03.
