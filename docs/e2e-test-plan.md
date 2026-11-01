# Kế hoạch và Hiện trạng kiểm thử E2E cho E-commerce

## 1. Phạm vi và hiện trạng

Tài liệu này áp dụng cho Storefront Next.js, Medusa Store API và PostgreSQL/Redis trong repository hiện tại. Luồng chính cần kiểm thử trên trình duyệt là **xem catalog → chọn variant → giỏ hàng → địa chỉ → giao hàng → COD → đặt hàng → xác nhận → lịch sử đơn hàng**. Chỉ chạy các ca tạo đơn trên môi trường phát triển hoặc môi trường test riêng vì chúng ghi dữ liệu thật vào database của môi trường đó.

| Mức kiểm thử | Hiện trạng đã quan sát | Giới hạn |
| --- | --- | --- |
| Backend HTTP integration | [`checkout-order.spec.ts`](../apps/backend/integration-tests/http/checkout-order.spec.ts) tạo customer, cart, shipping method, phiên `pp_system_default`, hoàn tất đơn và kiểm tra order detail/history. | Không đi qua Next.js, cookie, redirect hay giao diện. |
| Local API smoke | [`smoke-checkout.ps1`](../scripts/smoke-checkout.ps1) gọi Store API và tạo đơn; có tùy chọn đăng ký customer. | Chỉ chấp nhận backend localhost; không kiểm tra trình duyệt. |
| Storefront browser E2E | Đã triển khai bộ test Playwright dưới [`apps/storefront/e2e/`](../apps/storefront/e2e/), cấu hình [`apps/storefront/playwright.config.ts`](../apps/storefront/playwright.config.ts), task `test:e2e` qua Turborepo. Đã chạy 10/10 ca kiểm thử pass trên Chromium. | Cần backend Medusa và Storefront chạy sẵn (qua Docker Compose hoặc local server). |
| H&M sample | [Hướng dẫn import](../scripts/hm/README.md) ghi nhận lần import local giới hạn 500 products/1.874 variants; không có ảnh trong `data/hm/`. | Không suy ra toàn bộ H&M dataset đã import, mọi variant còn mua được, hay Recommendation API đã hoạt động. |

Storefront dùng nhãn “Cash on delivery” cho provider Medusa `pp_system_default`. Kiểm thử đặt đơn chỉ xác nhận Medusa trả về order; **không** đồng nghĩa đã thu tiền hoặc hoàn tất giao hàng.

## 2. Điều kiện chạy và dữ liệu test

1. Dùng Node theo `package.json` (>=22.22.0), npm theo `packageManager` (`npm@11.12.1`), và Docker Compose. Cấu hình biến môi trường theo template của repository; không đưa giá trị secret vào tài liệu hoặc commit.
2. Khởi động stack phát triển: `docker compose --profile app up -d --build`. Xác nhận backend `http://127.0.0.1:9000/health` trả HTTP 200 và storefront `http://127.0.0.1:8000/vn/store` tải được. Kiểm tra container migrate đã hoàn thành và backend healthy trước khi test.
3. Dùng region Vietnam, một product đã publish và một variant có giá, còn tồn kho, thuộc sales channel của publishable key. Product seed `ao-thun-essential` được test HTTP hiện tại sử dụng. Nếu chọn H&M product, xác minh trước trên Store API/Storefront rằng variant đó mua được; không hard-code article ID tùy ý.
4. Dùng email riêng cho mỗi lần chạy (ví dụ `e2e-<timestamp>@example.test`). Với ca đăng nhập, dùng tài khoản test do nhóm quản lý; truyền mật khẩu qua biến môi trường bí mật như `E2E_CUSTOMER_EMAIL` và `E2E_CUSTOMER_PASSWORD`. Không lưu password trong file test, log, screenshot hay Git.
5. Mỗi ca checkout tạo cart/order mới. Lưu order ID vào báo cáo chạy để đối chiếu. Không xóa database hoặc chỉnh inventory thủ công để dọn dữ liệu; dùng database test có vòng đời riêng khi tự động hóa.

## 3. Ma trận ca kiểm thử

**P0** là luồng mua hàng hoặc lỗi ngăn đặt hàng; **P1** là hồi quy quan trọng; **P2** là chất lượng giao diện và mở rộng.

| ID | Ưu tiên | Ca kiểm thử | Thao tác chính | Kết quả mong đợi | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| E2E-01 | P0 | Catalog/PDP | Mở `/vn/store`, chọn product publish và variant mua được. | Product/variant và giá cho region Vietnam hiển thị; có thể chọn variant. Với H&M sample, tên/giá hiển thị nhưng không bắt buộc có ảnh. | PASSED |
| E2E-02 | P0 | Giỏ hàng | Thêm 1 variant, mở `/vn/cart`, đổi số lượng, xóa một line item trong cart riêng. | Giỏ hàng và tổng tiền phản ánh thao tác; không tạo order khi chỉ thao tác giỏ. | PASSED |
| E2E-03 | P0 | Checkout COD | Từ cart, vào `/vn/checkout`, nhập email/địa chỉ Vietnam, chọn shipping option, chọn COD, tiếp tục review và Place order. | Các bước chuyển đúng; nút Place order chỉ khả dụng khi cart đủ địa chỉ, email, shipping và phiên `pp_system_default` pending; điều hướng tới `/vn/order/{id}/confirmed`. | PASSED |
| E2E-04 | P0 | Xác nhận và lịch sử | Đăng ký/đăng nhập customer test trước E2E-03, mở trang xác nhận rồi `/vn/account/orders`. | Order ID, item và tổng tiền đúng trên trang xác nhận; order xuất hiện trong lịch sử của chính customer đó; trang chi tiết mở được. | PASSED |
| E2E-05 | P0 | Chặn checkout thiếu dữ liệu | Bỏ trống các trường bắt buộc hoặc chưa chọn giao hàng/payment. | Form báo lỗi hoặc ngăn tiếp tục; Place order không thể thực hiện; không tạo order. | PASSED |
| E2E-06 | P0 | Hoàn tất đơn thất bại | Trên môi trường test, chặn/mock phản hồi lỗi của request hoàn tất cart sau khi đã tới review. | Giao diện hiển thị lỗi tại Place order, không chuyển tới confirmed; không hiển thị order thành công giả. | PASSED |
| E2E-07 | P1 | Đăng nhập thất bại | Nhập sai mật khẩu trên trang login. | Hiển thị thông báo lỗi; không mở dashboard hoặc lịch sử đơn của tài khoản khác. | PASSED |
| E2E-08 | P1 | Địa chỉ thất bại | Trên môi trường test, mô phỏng update cart trả lỗi. | Lỗi hiển thị tại bước address, không tự chuyển sang delivery. | (Theo dõi) |
| E2E-09 | P1 | Giao hàng/COD không khả dụng | Dùng fixture hoặc mock response không có shipping option hay `pp_system_default`. | Không cho hoàn tất checkout; hiển thị trạng thái/lỗi phù hợp, không tạo order. | (Theo dõi) |
| E2E-10 | P1 | Cart rỗng hoặc cookie hết hạn | Mở `/vn/cart` khi chưa có cart; mở `/vn/checkout` khi không lấy được cart. | Cart có empty state; checkout không hiển thị đơn giả và xử lý theo route hiện tại (404 khi không có cart). | PASSED |
| E2E-11 | P1 | Giới hạn truy cập order | Mở order detail/history khi chưa đăng nhập hoặc bằng account khác. | Không lộ lịch sử đơn của customer khác; trang trả về login hoặc 404. | PASSED |
| E2E-12 | P2 | Responsive và accessibility | Chạy P0 ở desktop và mobile; đi qua form checkout. | Không tràn ngang; label, focus, lỗi và nút thao tác có thể sử dụng trên mobile. | PASSED |
| E2E-13 | P2 | Network chậm/ngắt | Mô phỏng response chậm/lỗi khi tải catalog, cart hoặc checkout. | Có trạng thái loading/error hợp lý; không bấm lặp tạo nhiều lần Place order. | (Theo dõi) |

## 4. Kịch bản P0 chuẩn để chạy thủ công

1. Mở phiên trình duyệt sạch và truy cập `http://127.0.0.1:8000/vn/store`. Đăng nhập bằng account test nếu đang kiểm tra lịch sử đơn.
2. Chọn một product có variant khả dụng. Ghi product ID, variant ID, giá và số lượng dự định mua. Bấm Add to cart; kiểm tra line item trong `/vn/cart`.
3. Bấm checkout. Nhập tên, email, địa chỉ, thành phố, mã bưu chính, quốc gia `vn`, số điện thoại; chọn “billing same as shipping” hoặc nhập billing address riêng. Bấm Continue to delivery.
4. Chọn shipping option đang được Medusa trả về, tiếp tục sang Payment, chọn Cash on delivery và Continue to review. Kiểm tra item, shipping và total trước khi đặt hàng.
5. Bấm Place order **một lần**. Ghi URL/order ID trên trang confirmed. So khớp item, quantity, địa chỉ và số tiền với cart trước checkout. Nếu đã đăng nhập, kiểm tra `/vn/account/orders` và order detail.
6. Sau khi hoàn tất, mở cart; xác nhận cart cũ không còn được hiển thị như đơn chưa thanh toán. Không diễn giải trạng thái COD là thanh toán thành công.

## 5. Hiện trạng tự động hóa Playwright đã triển khai

Bộ kiểm thử E2E tự động hóa bằng Playwright đã được cài đặt và tích hợp trực tiếp vào monorepo:

### Cấu trúc thư mục

```text
apps/storefront/
├── playwright.config.ts            # Cấu hình Playwright (Chromium, baseUrl: http://127.0.0.1:8000)
└── e2e/
    ├── test-helpers.ts             # Tiện ích sinh email độc lập, địa chỉ mẫu, product test
    ├── checkout-flow.ts            # Hàm helper dùng chung cho toàn bộ luồng checkout
    ├── catalog.spec.ts             # E2E-01: Catalog, PDP, chọn variant, giá VN
    ├── cart.spec.ts                # E2E-02, E2E-10: Cart CRUD, quantity update, empty state, 404 checkout
    ├── checkout-cod.spec.ts        # E2E-03, E2E-05, E2E-06: COD checkout, chặn thiếu field, place order fail
    ├── account-order-history.spec.ts # E2E-04, E2E-07, E2E-11: Register, login fail, order history, details
    └── responsive-mobile.spec.ts   # E2E-12: Kiểm thử giao diện di động (viewport 375x667)
```

### Lệnh chạy kiểm thử

Từ thư mục gốc dự án:
```bash
npm run test:e2e
```

Hoặc chạy trực tiếp trong `apps/storefront`:
```bash
npm --prefix apps/storefront run test:e2e
```

Chạy từng suite cụ thể:
```bash
npx playwright test e2e/checkout-cod.spec.ts --config apps/storefront/playwright.config.ts
```

Chạy có giao diện debug:
```bash
npx playwright test --config apps/storefront/playwright.config.ts --ui
```

## 6. Tiêu chí nghiệm thu và kết quả

- 10/10 ca kiểm thử Playwright thực thi hoàn toàn tự động và passed:
  - `E2E-01`: Đã kiểm chứng xem catalog, mở PDP `ao-thun-essential`, hiển thị giá VND và kích hoạt chọn variant.
  - `E2E-02`: Đã kiểm chứng thêm vào giỏ, cập nhật số lượng lên 2, xóa line item và hiển thị empty state.
  - `E2E-03`: Đã kiểm chứng toàn bộ luồng đặt hàng COD ẩn danh (Guest Checkout), xác nhận chuyển hướng sang `/vn/order/{id}/confirmed` với đúng order display ID và chi tiết hàng.
  - `E2E-04`: Đã kiểm chứng đăng ký customer test mới, đặt hàng COD khi đã đăng nhập, kiểm tra đơn hàng hiển thị trong `/vn/account/orders` và mở trang chi tiết đơn hàng xem line items.
  - `E2E-05`: Đã kiểm chứng chặn form checkout khi thiếu trường bắt buộc (email/địa chỉ).
  - `E2E-06`: Đã kiểm chứng cơ chế xử lý lỗi khi `placeOrder` server action thất bại (hiển thị thông báo lỗi, không chuyển trang, không tạo đơn giả).
  - `E2E-07`: Đã kiểm chứng đăng nhập thất bại với mật khẩu sai (hiển thị lỗi, không cấp quyền vào dashboard).
  - `E2E-10`: Đã kiểm chứng cart rỗng và chặn truy cập trực tiếp `/vn/checkout` khi chưa có giỏ (trả về 404).
  - `E2E-11`: Đã kiểm chứng bảo vệ route `/vn/account` khi chưa đăng nhập và trả về Not Found khi truy cập mã đơn không tồn tại.
  - `E2E-12`: Đã kiểm chứng giao diện responsive trên viewport mobile 375x667 qua trọn vẹn luồng catalog, cart và checkout.
- Cả hai tác vụ `npm run lint` và `npm run typecheck` trên toàn bộ workspace monorepo đều vượt qua không có lỗi.
