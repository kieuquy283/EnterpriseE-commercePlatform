# Phase 03 — Medusa recommendation module, publisher và API

> **ID:** REC-PDP-P03 · **Phụ thuộc:** P02 technical PASS, P01 DB mapping PASS · **Ưu tiên:** P0
> **Spec:** `PDP-API-01..05`, `PDP-NFR-01/03`, `PDP-T03..06` trong [spec.md](spec.md).
> **Report:** `docs/recommendation/pdp/reports/phase_03_report.md`.

## 1. Mô tả đơn giản

Dùng code Recommendation **đã có trên branch `recommendation`** để Medusa trả về tối đa 6 sản phẩm tương tự ở dạng Store Product, đúng giá và tình trạng bán. Dữ liệu ứng viên được publish theo version, có rollback; API không được làm sai giao dịch mua hàng.

## 2. Đầu vào

- `candidates-product-detail.jsonl` đã kiểm tra và version/manifest.
- Backend Recommendation module, migration, publish workflow, Store API và Medusa Store Product adapter hiện hữu.
- PostgreSQL **test riêng** đã migrate, test fixture publishable API key/region/channel.

## 3. Công việc cụ thể

1. Audit `apps/backend/src/modules/recommendation/`, `src/workflows/recommendation/publish.ts` và script publisher; **không tạo lại module/bảng khác**.
2. Validate version, scores/ranks/targets, candidate context; publish staging→ready→active, không đổi active khi import lỗi; rerun cùng version là idempotent; rollback ready version.
3. Xác nhận route `GET /store/recommendations` nhận `placement=product_detail`, `product_id`, `region_id`, `limit` đúng allow-list; `customer_id`/unknown params bị từ chối.
4. Batch query candidates tối đa 100/context; duy trì thứ tự, loại current Product, duplicates, unpublished, sai channel/region/price, không mua được; **dùng Medusa native commerce** cho inventory/backorder/price.
5. Khi thiếu candidate, bù hợp lệ bằng popularity/category/catalog hoặc trả []; trả `strategy`/`fallback_reason` trung thực. Không bịa score, không lấy candidate ID không còn sản phẩm.
6. Review response projection: đủ `ProductPreview` nhưng không lộ H&M article ID, customer hash, private scores, metadata nội bộ, auth data.
7. Review `store-products.ts`: đang dùng import API/middlewares nội bộ **Medusa 2.21.2**; khóa version và regression tests hoặc chuyển public-stable API nếu có phương án tương đương đã kiểm chứng. Không tự viết giá/tồn kho.
8. Review timeouts/concurrency: route hiện có in-flight cap, deadline 4s; kiểm lỗi xảy ra trước route middleware. Không dùng blocking library/model inference online.
9. Đảm bảo backend flag OFF → route 404; offline candidate reader không phụ thuộc checkout; không chạy migration-down ngoài disposable test DB.

## 4. File code có thể cần sửa (chỉ khi test/contract gap)

- `apps/backend/src/api/store/recommendations/route.ts`
- `apps/backend/src/modules/recommendation/{service.ts,store-products.ts,coalesce.ts,models/,migrations/}`
- `apps/backend/src/workflows/recommendation/publish.ts`
- `apps/backend/src/scripts/publish-hm-recommendations.ts`
- `apps/backend/integration-tests/http/recommendations.spec.ts`

## 5. Test bắt buộc

| Case | Kỳ vọng |
|---|---|
| Valid product/region | `200`, 0..6 StoreProducts, đúng region/price, không self |
| Invalid params | HTTP 400; product unavailable 404 |
| Candidate store broken/empty | Safe Medusa fallback hoặc [], không 500 giả |
| Redis unavailable | Phục vụ theo fallback phù hợp; không cache stale pricing |
| Draft, missing price, wrong channel, zero stock | Không hiển thị hàng không bán được; backorder theo Medusa |
| Publish rerun/fault | Same version không duplicate; failed staging không đổi active |
| Rollback | Restore ready version, order/product records không bị thay đổi |
| Security | Payload không chứa raw H&M, customer IDs, private metadata |

## 6. Exit gate

**PASS** khi HTTP integration tests trên Medusa/test PostgreSQL thật pass, publish/reimport/rollback có evidence, API bị giới hạn context và data projection đúng. Unit mocks **không thay thế HTTP/DB tests**. Ghi rõ native Store adapter phụ thuộc phiên bản và phải retest khi nâng Medusa.

## 7. Rollback

- Tắt backend `ENABLE_RECOMMENDATIONS` hoặc activate lại một ready version đã xác minh.
- Không xóa product/variant/order, không sửa core tables hay volumes.
- Bất kỳ lỗi DB/sandbox/permissions nào cũng ghi BLOCKED, không giả kết quả.
