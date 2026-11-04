# Phase 04 — Next.js Product Detail integration

> **ID:** REC-PDP-P04 · **Phụ thuộc:** P03 PASS · **Ưu tiên:** P0
> **Spec:** `PDP-FR-01..04`, `PDP-T07..10` trong [spec.md](spec.md).
> **Report:** `docs/recommendation/pdp/reports/phase_04_report.md`.

## 1. Mô tả đơn giản

Khách xem một sản phẩm H&M trên trang chi tiết sẽ thấy phần **Similar Products** ở dưới, tối đa 6 thẻ. Nếu API lỗi hoặc sản phẩm không có ứng viên phù hợp, trang vẫn hiển thị bình thường và có thể dùng Related Products cũ hoặc ẩn phần này.

## 2. Đầu vào

- Store API của Phase 03 có kết quả thật với H&M Product ID và region hợp lệ.
- `apps/storefront/src/lib/data/recommendations.ts`, `apps/storefront/src/modules/products/components/related-products/index.tsx` hiện có trên branch `recommendation`.
- `ProductPreview`, `getRegion`, `listProducts`, Product Detail page, Playwright config.

## 3. Việc cần làm

1. Reuse helper `getRecommendations` sử dụng Medusa SDK, auth headers đúng và `cache: no-store`; không gọi Python từ Next.js.
2. Từ PDP hiện tại truyền **Medusa product.id** và `region.id`, không truyền article_id hay `customer_id`.
3. Với strategy chính xác `hm_metadata_similarity`, hiển thị nhãn “Similar products”; khi bù catalog/popularity, dùng nhãn thành thật “You may also like”/“Related products”, không gọi tất cả kết quả là AI personalization.
4. Chỉ render tối đa 6 ProductPreview trong grid responsive; loại product đang xem và dedupe trong view để chống dữ liệu API sai. Mỗi link phải trỏ đúng handle, giá lấy qua Medusa.
5. Gặp thiếu ảnh → placeholder có quyền sử dụng; không tự tải hoặc public ảnh H&M chưa được cấp phép.
6. Với API lỗi/503/timeout/no products, fallback to legacy RelatedProducts hoặc ẩn optional rail; không throw làm fail PDP và không chặn Cart/Checkout.
7. Giữ `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=false` mặc định cho public; biết rằng flag Next.js có thể là **build-time** và cần rebuild khi đổi.
8. Review UX: heading semantic (`h2`), section aria-labelledby, link focus/keyboard, 360px, desktop, no horizontal overflow, loading/empty states hợp lý.
9. Không thay Homepage Popularity nếu không có bug dùng chung ảnh hưởng PDP; không refactor commerce core ngoài scope.

## 4. File dự kiến

- `apps/storefront/src/lib/data/recommendations.ts`
- `apps/storefront/src/modules/products/components/related-products/index.tsx`
- `apps/storefront/e2e/recommendations.spec.ts`, có thể bổ sung `pdp-similar-products.spec.ts`
- Nếu cần test fixture: `apps/storefront/e2e/test-helpers.ts` — chỉ thay nhỏ, không ảnh hưởng lịch sử checkout.

## 5. Test cases

- PDP của **H&M Product có candidates**: heading, link, price/region, 1..6 items, self excluded.
- PDP của **non-H&M fixture**: fallback trung thực hoặc rail không xuất hiện; PDP vẫn hoạt động.
- PDP **không ảnh**: placeholder đúng; layout không vỡ.
- Product thiếu ứng viên/only 1-2 candidates: count dưới 6 hoặc bù hợp lệ, không duplicate.
- Frontend ON/API OFF: page load và cart vẫn sử dụng được; endpoint lỗi không gây 500 toàn trang.
- Frontend OFF: hành vi RelatedProducts cũ như trước, PDP không gọi feature mới.
- Mobile 360px và keyboard focus; link không trỏ về PDP hiện tại.

## 6. Exit gate

**PASS** khi PDP E2E trên target commit pass cho H&M/non-H&M/error/flag/mobile, Next typecheck/build pass, và không hồi quy Cart/Checkout/Order. Test cả production build nếu chạy feature flags; dev mode không đủ chứng minh build-time flag.

## 7. Rollback

Tắt flag frontend rồi rebuild Next.js nếu cần; hoặc backend flag OFF; component trở về fallback cũ. Không cần đổi Product/Order trong DB.
