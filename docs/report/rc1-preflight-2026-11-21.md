# RC1 — rà soát trước nghiệm thu ngày 21/11/2026

**Phạm vi:** FE-05 (FR-ORD-01/02), FE-06 (trải nghiệm đa màn hình), FE-07 (FR-REC-02) và điều kiện bàn giao Checkpoint 3 ngày 22/11. Đây là báo cáo chuẩn bị, chưa phải quyết định phát hành RC1.

**Mã nguồn kiểm tra:** nhánh `frontend`, HEAD `8e62980` cộng các thay đổi chưa commit trong working tree. Do đó kết quả dưới đây không phải bằng chứng trên một commit bất biến. Node `v24.15.0` khác bản repo ghim `24.22.1`; npm `11.12.1` khớp.

## Kết quả đã quan sát

| Kiểm tra | Môi trường và kết quả |
| --- | --- |
| `npm run lint` tại `apps/storefront` | PASS, không có lỗi ESLint. |
| `npm run typecheck` tại `apps/storefront` | PASS, không có lỗi TypeScript. |
| `npm run build` tại `apps/storefront` | PASS; Next.js 15.5.29 biên dịch và tạo các route. Không chứng minh hành trình trình duyệt. |
| `npx playwright test --list --reporter=list e2e/design-system.spec.ts e2e/pdp-similar-products.spec.ts` | PASS bước khám phá: 8 ca thiết kế được nhận diện; ca PDP phụ thuộc cờ môi trường nên không được chọn ở cấu hình hiện tại. Không chạy trình duyệt. |
| E2E account, responsive, COD và recommendation | **Chưa chạy trong lượt này.** `127.0.0.1:8000/9000` không phản hồi, Docker Desktop service dừng; thử khởi động service không thành công. Cần PostgreSQL/Redis và fixture dùng riêng trước khi chạy. |

Tệp `apps/storefront/test-results/.last-run.json` hiện ghi `failed` với ba mã ca, nhưng không có thông tin đủ để quy kết nguyên nhân hoặc gắn kết quả đó với một commit. Báo cáo HTML hiện tại cũng chưa phải bằng chứng của ứng viên RC1. Các sửa đổi chưa commit đã có từ trước trong bài E2E được giữ nguyên để cộng tác viên đối soát. Trường `+customer_id` đã được bổ sung vào truy vấn chi tiết đơn trong ứng viên mã; quyền sở hữu A/B vẫn phải được thử trên backend riêng.

## Độ phủ yêu cầu và trạng thái

| Nhóm SRS | Mã / điều kiện cần kiểm | Trạng thái lượt rà soát này |
| --- | --- | --- |
| Danh tính và quyền | FR-AUTH-01..04; AT-04/09/10 | Mã UI và guard hiện có; chưa chạy thử hai khách A/B trên cùng ứng viên. |
| Danh mục và giá | FR-CAT-01..05; AT-11 | Mã catalog/PDP hiện có; chưa xác nhận 30 sản phẩm/230 SKU trên backend test. |
| Giỏ hàng | FR-CART-01..04; AT-12 | Mã đồng bộ cart hiện có; chưa chạy E2E lượt này. |
| Checkout và đơn | FR-CHK-01..04, FR-ORD-01/02; AT-01/13/17 | Build đạt; danh sách/chi tiết/trạng thái cần browser và API ownership test. |
| Thanh toán | FR-PAY-01..05; AT-02/03/14 | COD chưa được chạy lại; không suy từ nút chống nhấp lặp thành idempotency backend. |
| Tồn kho | FR-INV-01..03; AT-15/16 | Chưa kiểm tranh chấp SKU cuối hoặc đối soát tồn trên môi trường riêng. |
| Thông báo | FR-NOT-01..03; AT-05 | Chưa kiểm worker, retry/idempotency và gửi tới người nhận. Lỗi thông báo không được đổi kết quả đơn. |
| Staff/Admin | FR-ADM-01/02, FR-AUTH-04; AT-10/18 | PR #18 vẫn draft; chưa nghiệm thu luồng Staff/Admin tích hợp. |
| Gợi ý tùy chọn | FR-REC-02 | Có fallback Store API và timeout 2 giây trong mã; chưa chạy browser với cờ OFF, 404/500 và timeout. |

Theo [ma trận truy vết](../03-requirements/requirements-traceability.md), liên kết UC/FR/AT là đề xuất truy vết, không tự chứng minh ca nghiệm thu đã đạt.

## Tích hợp và việc tiếp theo

- PR #19 đã merge vào `main`; dữ liệu 30 sản phẩm/230 SKU có báo cáo nhập trên database riêng, chưa xác nhận trên môi trường kiểm thử của lượt này.
- PR #18 ở trạng thái draft mở tại thời điểm rà soát; không gộp vào kết luận RC1.
- Quý/QA: dựng stack test dùng riêng, chạy cùng một SHA cho account A/B, catalog, cart, COD, 375/768/1440 px và recommendation OFF/lỗi; lưu lệnh, kết quả, trace/video và báo cáo HTML mới.
- Quý/Design: đối chiếu màu mực nêu trong kế hoạch (`#1A1A1A`) với token hiện hành (`#1B1D1A`) trước khi đổi palette; không suy rằng build đạt là màu đã được duyệt.
- Backend/QA: xác nhận Medusa trả `customer_id` cho đơn, xử lý trùng ý định, tồn kho và notification worker độc lập với kết quả đặt hàng.
- Quý: đối chiếu các thay đổi E2E chưa commit của cộng tác viên và cập nhật báo cáo sau khi có E2E trên SHA ứng viên. Chưa kết luận `FEATURE COMPLETE` hoặc phát hành RC1.
