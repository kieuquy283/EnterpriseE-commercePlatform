# Báo cáo kiểm thử Storefront E2E

- **Ngày:** 2026-11-09
- **Nhánh:** `test/storefront-playwright-regression`
- **Base:** `origin/main` (`389e855`)
- **Môi trường:** backend và Storefront chạy local, Chromium

## Kết quả

| Phạm vi | Kết quả | Nội dung |
|---|---:|---|
| Auth/Account | Đạt | Guest restriction, login lỗi, đăng ký và lịch sử đơn hàng |
| Catalog | Đạt | Danh sách sản phẩm, PDP, chọn biến thể |
| Cart | Đạt | Trạng thái rỗng, thêm sản phẩm, đổi số lượng, xóa |
| Checkout/Payment trên Storefront | Đạt | COD guest/member, validation và lỗi khi submit đơn |
| Payment simulator backend | Đạt | Thanh toán thành công; thanh toán thất bại không tạo đơn/không đổi tồn kho |
| Recommendation UI | Đạt có điều kiện | UI fallback “Explore products” có sản phẩm; PDP hoạt động khi recommendation tắt |
| Responsive mobile | Đạt | Catalog, PDP, Cart và Checkout trên viewport mobile |

**Tổng:** 11/11 Playwright E2E đạt; 2/2 backend integration test đạt.

## Lệnh và bằng chứng

```powershell
npm run backend:dev
npm run storefront:dev
```

Health check: `http://127.0.0.1:9000/health` trả HTTP 200; Storefront `http://127.0.0.1:8000/vn` trả HTTP 200. Store API regions và products cũng trả HTTP 200.

```powershell
npm exec --workspace=@dtc/storefront -- playwright install chromium
```

Đạt; cài Chromium đúng phiên bản Playwright yêu cầu.

```powershell
npm run test:e2e --workspace=@dtc/storefront -- e2e/account-order-history.spec.ts e2e/catalog.spec.ts e2e/cart.spec.ts e2e/checkout-cod.spec.ts e2e/recommendations.spec.ts e2e/responsive-mobile.spec.ts
```

Đạt: **11 passed** (50.3 giây).

```powershell
npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/checkout-order.spec.ts
```

Đạt: **1 test suite passed, 2 tests passed** (76.729 giây). Bao gồm checkout thành công và simulator từ chối thanh toán.

```powershell
npm run typecheck --workspace=@dtc/storefront
git diff --check
```

Cả hai lệnh đạt.

## Recommendation và giới hạn

Recommendation đã được tích hợp vào Storefront, nhưng `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS` và `ENABLE_RECOMMENDATIONS` chưa được cấu hình trong env local. Vì vậy, test xác nhận rail fallback “Explore products” (1–12 sản phẩm) và PDP vẫn dùng được khi không có rail tương tự; **chưa xác nhận UI của recommendation khi bật cờ tính năng**.

Lần chạy E2E đầu tiên không khởi chạy được Chromium vì browser chưa cài. Sau khi cài Chromium, test chạy được; lần chạy đầu phát hiện assertion cũ kỳ vọng rail trang chủ biến mất khi tắt recommendation, trái với UI hiện tại luôn hiển thị rail catalog fallback. Assertion đã được sửa trong [recommendations.spec.ts](../apps/storefront/e2e/recommendations.spec.ts) và cả tập test đạt ở lần chạy cuối.

Chỉ chạy các spec regression liệt kê ở trên, không chạy toàn bộ các bài H&M image E2E.
