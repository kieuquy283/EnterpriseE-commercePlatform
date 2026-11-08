# Phase 06 — PDP integration

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 05 · **Owner:** Next.js Engineer + QA · **Estimate:** 1–3 person-days (giả định). Trang chi tiết hiển thị tối đa 6 món từ API và ảnh/giá Medusa của chính món đó. Khi gợi ý lỗi, khách vẫn xem và mua hàng bình thường.

**Already exists:** `apps/storefront/src/lib/data/recommendations.ts` (server fetch, 6s timeout/no-store), `src/modules/products/components/related-products/index.tsx` (legacy fallback), `product-preview/`, `image-gallery/`, `product-image/`; Playwright `e2e/pdp-similar-products.spec.ts`, `hm-image-serving.spec.ts`. **Missing:** label cho Hybrid strategy, v2-specific error/quality cases. **Unverified:** layout/URL media và performance trên active v2 run.

**Inputs:** API Phase 05, valid Medusa region, image URL permitted in test context. **Outputs:** PDP cards/label/fallback và E2E evidence. **Files to modify if required:** `apps/storefront/src/modules/products/components/related-products/index.tsx`, `src/lib/data/recommendations.ts`, existing PDP E2E; proposed report `reports/phase_06_report.md`.

1. **P0** Map `hm_hybrid_similarity` → “Similar products” và mô tả đúng nguồn; mixed/catalog fallback → “You may also like”. Không hiển thị score/article IDs.
2. **P0** Reuse `ProductPreview` và Medusa calculated price/region; 0–6 unique/non-self; đúng thumbnail/gallery từng recommended Product, placeholder nếu thiếu/broken image.
3. **P0** Giữ frontend flag `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS` (build-time), backend flag và legacy fallback; API 503/timeout không chặn PDP/Cart/Checkout.
4. **P1** Test mobile 360px, keyboard, section heading, skeleton/empty/error; review ảnh origin/Next image config; đo page performance trước/sau.

**Acceptance:** Given 6 saleable candidates, when mở PDP, then 6 cards đúng ID/ảnh/giá và không self. Given API 503 hoặc ảnh 404, then PDP vẫn render, placeholder/legacy rail/hidden state có nhãn đúng. Given flag OFF, then không có Hybrid request cần thiết và native shopping vẫn hoạt động. **Test:** `npm run typecheck --workspace=@dtc/storefront`, `npm run lint --workspace=@dtc/storefront`, `npm run build --workspace=@dtc/storefront`, `npm run test:e2e --workspace=@dtc/storefront -- e2e/pdp-similar-products.spec.ts` trên isolated stack. **Gate:** PASS khi E2E + mobile/error/flag cases chạy thật; BLOCKED nếu media/public rights ngăn môi trường mục tiêu. **Risk/fallback:** thiếu thumbnail ở `commerce` DB → placeholder, không nhận là image integration đã xong. **Rollback:** frontend flag OFF + rebuild, giữ legacy related-products. **Core commerce:** không sửa cart/checkout. **Next:** 07. Báo cáo: `reports/phase_06_report.md` (proposed).
