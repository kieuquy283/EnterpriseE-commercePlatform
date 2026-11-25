# RC1 — bằng chứng trước Checkpoint 3 ngày 22/11/2026

**Ngày ghi nhận:** 21/11/2026. **Ứng viên mã:** `777f8c0c87ce19f117436b532738e4fb4d6a8d95` trên nhánh `frontend`. **Quyết định:** `PARTIAL` — các luồng storefront thuộc FE-05/06/07 đã đạt bộ kiểm tra hiện có; chưa đủ bằng chứng để kết luận toàn bộ 9 nhóm FR `FEATURE COMPLETE` hay phát hành RC1. Đây không phải biên bản cuộc họp dự kiến lúc 21:00 ngày 22/11.

## Môi trường và cách gắn bằng chứng với mã

- Storefront chạy từ production build của ứng viên mã; backend Medusa được build từ cùng working tree ứng dụng. PostgreSQL và Redis nằm trong Docker Compose project riêng `daymark-rc1`, volume riêng, cổng `15432/16379`; backend test tại `19000`. Container backend cũ ở cổng `9000` và các volume của nó không được dùng để tạo tài khoản hoặc đơn hàng test.
- `seed-commerce` tạo vùng Việt Nam, kênh bán và sản phẩm smoke. Importer DAYMARK dry-run xác nhận đích `127.0.0.1:15432`, sau đó apply thêm **30 sản phẩm, 230 biến thể, 3 bộ sưu tập, 6 danh mục và 230 mức tồn**; phép đọc lại của importer cho lần chạy lặp ghi 0 insert/update. Lượt import này chọn `--images none`, nên chưa chứng minh 30 ảnh sản phẩm được phục vụ.
- Bộ test và `playwright.config.ts` được trích bằng `git archive` từ đúng commit `777f8c0`; Playwright chạy **1 worker** trên production storefront với `PLAYWRIGHT_BASE_URL=http://localhost:8000`. Những bài E2E cộng tác viên đang chỉnh sửa trong working tree không tham gia lượt chốt này.
- Máy chạy storefront có Node `24.15.0`, khác phiên bản `24.22.1` repo ghim; image backend dùng Node `24.22.1`. npm cục bộ `11.12.1` khớp root package manager.

## Kết quả kỹ thuật và bằng chứng

| Phép kiểm | Kết quả |
| --- | --- |
| Storefront lint, typecheck, production build, oxfmt | PASS. Hook commit cũng chạy format và lint trên 7 file đã stage. |
| Playwright Chromium toàn suite từ commit `777f8c0` | **21 pass, 6 skip, 0 fail** trong 4,8 phút; gồm đăng ký/COD/lịch sử đơn, cách ly khách A/B, catalog, cart, responsive, bàn phím, hydration và recommendation OFF fallback. |
| Cách ly đơn A/B | Khách A đặt COD và xem chi tiết; JWT của B khác A; B xem lịch sử của mình rồi mở cùng ID đơn, nhận trang “Trang này đã hết mùa”, không có chi tiết hay email đơn của A. |
| CI trước commit bổ sung (`a8ceeb5`) | API tests và CI hoàn tất thành công. CI cho commit `777f8c0` cần đối chiếu sau khi push; CI hiện không thay thế lượt browser E2E cục bộ. |

[Báo cáo Playwright HTML](rc1-evidence-777f8c0/index.html) chứa tám ảnh chụp đính kèm: home, catalog, PDP/badge giỏ, cart, checkout review, xác nhận đơn, chi tiết của chủ đơn và trang 404 của khách khác. Gói HTML và ảnh là **9 file, khoảng 3,02 MB**. Không có video/trace của ca pass vì cấu hình Playwright chỉ giữ video khi fail và trace ở lần retry đầu.

## Ma trận truy vết nghiệm thu Tuần 1

Theo [SRS](../03-requirements/SRS.md) và [RTM](../03-requirements/requirements-traceability.md), kết quả E2E sau chỉ chứng minh các lát cắt được chạy, không thay cho toàn bộ AT hoặc bất biến backend.

| Nhóm FR | Bằng chứng trong lượt này | Trạng thái |
| --- | --- | --- |
| FR-AUTH-01..04 — danh tính/quyền | Đăng ký, đăng nhập sai, route guard và cách ly chi tiết đơn A/B đạt; chưa chạy mọi phép kiểm profile, xác thực email và Staff auth. | Một phần |
| FR-CAT-01..05 — danh mục/giá | Catalog 30 sản phẩm/230 biến thể, tìm kiếm, collection, PDP và giá VND đạt E2E; ảnh sản phẩm từ importer chưa nạp. | Một phần |
| FR-CART-01..04 — giỏ | Thêm, đổi số lượng, xóa, badge và trạng thái giỏ rỗng đạt E2E. | Đạt lát cắt storefront |
| FR-CHK-01..04 và FR-ORD-01/02 — checkout/đơn | COD khách và thành viên, xác nhận đơn, danh sách/chi tiết, trạng thái tiếng Việt và chặn truy cập khác chủ đạt; chưa kiểm transfer request và mọi trạng thái fulfillment. | Một phần |
| FR-PAY-01..05 — thanh toán | Luồng COD và phản hồi lỗi đặt hàng đạt UI E2E; chưa chứng minh idempotency, đối soát hoặc hoàn tiền ở backend. | Một phần |
| FR-INV-01..03 — tồn kho | Importer xác nhận tồn đầu kỳ và E2E chọn biến thể; chưa thử tranh chấp SKU cuối, trừ tồn hay hoàn tồn. | Chưa nghiệm thu |
| FR-NOT-01..03 — thông báo | Chưa chạy worker, retry/idempotency hay gửi đến người nhận; luồng đặt đơn UI không phải bằng chứng thông báo. | Chưa nghiệm thu |
| FR-ADM-01/02 — Staff/Admin | Chưa chạy hành trình Staff/Admin tích hợp; PR #18 vẫn draft tại thời điểm ghi nhận. | Chưa nghiệm thu |
| FR-REC-02 — gợi ý tùy chọn | Cờ OFF: home/PDP hiện fallback Store API, giới hạn sản phẩm và không chặn cart/checkout; chưa cưỡng bức lỗi 404/500 hoặc timeout 2 giây trong E2E. | Một phần |

FE-06 đạt các ca bố cục 375/768/1440px, reduced motion, skip link, phím Escape, nút thương mại và không phát hiện hydration mismatch trong lượt chốt.

## Known issues và bàn giao

- Sáu ca ảnh H&M được skip vì cần fixture ảnh H&M riêng; sản phẩm DAYMARK import trong lượt này không có ảnh gắn vào Medusa. Ảnh editorial tĩnh đã tải thành công.
- Khi `notFound()` xảy ra trong nội dung được stream, trình duyệt có thể nhận HTTP 200 cùng giao diện 404. Ca cách ly A/B xác nhận **không hiển thị dữ liệu đơn của A**; cần kiểm riêng mã HTTP nếu AT yêu cầu đúng status 404 ở tầng giao thức.
- Lượt E2E chưa cưỡng bức recommendation 404/500/timeout, lỗi Redis worker, tranh chấp tồn hay trùng ý định checkout. Các mục này vẫn thuộc QA/backend Tuần 2.
- PR #19 (dữ liệu) và #20 (backend) đã merge vào `main`; PR #18 (Ops/CI) còn draft. PR `frontend` #21 giữ draft để review và tích hợp; chưa merge, deploy hay mở rộng hạ tầng AWS.
- Các file E2E và report cũ còn sửa đổi chưa commit của cộng tác viên được giữ nguyên. Gói bằng chứng này xuất từ snapshot Git sạch trong `.tmp`, không ghi đè report của họ.

**Đề nghị Checkpoint 3:** ghi nhận FE-05/06/07 đủ điều kiện bàn giao phần storefront, tiếp tục nghiệm thu riêng tồn kho, thông báo, Staff/Admin và các phép thử lỗi. Chỉ đổi trạng thái toàn hệ thống sang `FEATURE COMPLETE` khi các owner có bằng chứng cho các nhóm còn thiếu.
