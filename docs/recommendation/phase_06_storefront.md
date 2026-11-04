# Phase 06 — Next.js Home and Product Detail Recommendation Rails

> **Status:** PASS private. [Report](reports/phase_06_report.md). **Depends on:** [Phase 05](phase_05_serving_api.md). **Unlocks:** [Phase 07](phase_07_evaluation_release.md).
> **Reference:** [Spec](spec.md) (`REC-FR-01/02`, frontend contract).

## 1. Mô tả đơn giản

Hiển thị kết quả recommendation **ngay trong website có sẵn**, không viết UI mới toàn bộ. Trang chủ có mục tối đa **12 Popular Products**; mỗi Product Detail có tối đa **6 Similar Products**. Nếu API lỗi, người dùng vẫn xem sản phẩm/đặt hàng bình thường.

## 2. Inputs

- Phase 05 endpoint request/response và test fixtures, region/publishable key conventions.
- Existing Home page, `RelatedProducts`, `ProductPreview`, skeleton/placeholder và fetch helpers.
- Feature flag được review; default **OFF ở môi trường public** cho tới khi Phase 07 GO.

## 3. Tasks

- [ ] **06.1 Data adapter:** tạo `apps/storefront/src/lib/data/recommendations.ts`; dùng Medusa SDK/server fetch hiện có, region và auth/publishable key đúng; giới hạn timeout.
- [ ] **06.2 Homepage:** component `apps/storefront/src/modules/home/components/popular-products/`; đặt rail dưới hero/featured theo UI hiện tại, render ≤12, handle empty/skeleton/error.
- [ ] **06.3 PDP:** nâng `apps/storefront/src/modules/products/components/related-products/index.tsx` hoặc wrapper để gọi `product_detail` bằng Medusa product ID; ≤6; không current product/duplicates.
- [ ] **06.4 Labels:** API có actual H&M popularity → có thể ghi `Popular in H&M historical data`; fallback catalog → `Featured Products`. `Similar Products` rõ đây là metadata-based, không gọi personalized recommendations.
- [ ] **06.5 Product card:** reuse `ProductPreview`, Medusa region VND pricing, images/placeholder có quyền; không tính lại price/stock ở frontend.
- [ ] **06.6 Failure/flag:** feature flag off → behavior hiện tại (homepage collection, PDP related section) hoặc ẩn rail; đảm bảo homepage/PDP không crash; checkout code untouched.
- [ ] **06.7 UI tests:** mobile + desktop, loading, empty, API error, no image, stale candidate, 6/12 limits, navigation from rail to PDP, flag-off.
- [ ] **06.8 Cross-branch:** nếu tận dụng Playwright suite ở remote `recommendation`, port/cherry-pick chọn lọc lên branch mới dựa trên `main`, không merge nguyên nhánh cũ đang diverged.

## 4. Files / evidence

- **New:** `apps/storefront/src/lib/data/recommendations.ts`, `apps/storefront/src/modules/home/components/popular-products/*`.
- **Modify:** Home page, `apps/storefront/src/modules/products/components/related-products/index.tsx` và tests tương ứng.
- **Docs:** `docs/recommendation/evidence/phase_06_ui_e2e_report.md`, screenshots có quyền và không có PII.

## 5. Acceptance criteria

- [ ] Home ≤12, PDP ≤6, không duplicate/self; ProductPreview giá theo Medusa, link/navigate đúng.
- [ ] Có responsive 360px/mobile và desktop, accessible heading/empty/skeleton.
- [ ] API timeout/error/0 results không chặn trang; không đổi cart/checkout/order API.
- [ ] Tắt flag khôi phục behavior cũ; E2E flag-on và flag-off pass ở đúng commit.
- [ ] Không dùng ảnh H&M chưa có quyền trong public demo.

**GO Phase 07:** UI hoàn thiện và browser tests pass trên dev/staging; performance chưa cần được tuyên bố đạt tới Phase 07.

## 6. Risk & rollback

- **Slower page:** fetch có timeout/deferred UI phù hợp Next.js; đo lại ở Phase 07.
- **Missing media:** placeholder được phép; không tự public H&M images.
- **Rollback:** set flag OFF/rollback frontend commit, không xóa data/model. **Handoff:** screenshots, test results và endpoint compatibility cho QA/DevOps.
