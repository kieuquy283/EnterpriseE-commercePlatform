# Phase 05 — Medusa Recommendation Store API & Safe Fallback

> **Status:** PASS private. [Report](reports/phase_05_report.md). **Depends on:** [Phase 04](phase_04_candidate_publishing.md). **Unlocks:** [Phase 06](phase_06_storefront.md).
> **Reference:** [Spec](spec.md) (`REC-API-01..05`, `REC-NFR-02..05`).

## 1. Mô tả đơn giản

Tạo một Store API để Next.js lấy **Popular 12 / Similar 6** từ database đã publish. API phải kiểm lại qua Medusa rằng sản phẩm vẫn **được bán ở đúng region, có giá và phù hợp tồn kho**, rồi mới trả về. Nếu không có candidates, dùng sản phẩm hợp lệ khác làm dự phòng; không ảnh hưởng checkout.

## 2. API contract

```http
GET /store/recommendations?placement=home&region_id=reg_...&limit=12
GET /store/recommendations?placement=product_detail&product_id=prod_...&region_id=reg_...&limit=6
```

- `placement` bắt buộc: `home` hoặc `product_detail`; PDP bắt buộc `product_id`. `limit`: default 12/6, integer 1..24. `region_id` phải hợp lệ, gắn với context Store API/publishable key; không nhận `customer_id`.
- Scan tối đa **100 candidate IDs** từ active run, kết hợp fallback nếu thiếu. Trả `placement`, `strategy`, `version`, optional `fallback_reason`, `products` có schema tương thích Store API/ProductPreview. Không lộ raw H&M IDs, customer hashes hoặc ranking scores.
- Status `200` có products/[]; `400` invalid input; `404` target PDP không tồn tại hoặc không bán được (phải nhất quán với project not-found); `5xx` cho Medusa DB/API không sẵn sàng. Candidate store không có dữ liệu nhưng Medusa catalog khỏe → fallback catalog; Redis down → đọc DB.

## 3. Tasks

- [ ] **05.1 Route/schema:** route `apps/backend/src/api/store/recommendations/route.ts`, input validation + hard caps, safe errors.
- [ ] **05.2 Read active version:** lấy 1 `run_id` tại đầu request, query ranked IDs theo context, không đọc bản `staging`.
- [ ] **05.3 Batch Medusa product resolve:** resolve nhiều candidates trong một/few queries, không gọi API một lần/sản phẩm; dùng behavior Store APIs/region/pricing/publishable key hiện có của Medusa 2.21.2, không tự làm bảng giá.
- [ ] **05.4 Saleability:** filter unpublished, wrong sales channel, wrong region/price context, unpurchasable variants theo Inventory/backorder rule thật. Loại current PDP product, dedupe and preserve ranking.
- [ ] **05.5 Fallback order:** Similar same-group Popular → global Popular → Medusa deterministic catalog; Home global Popular → deterministic catalog. Ở Home nếu fallback, trả strategy/label phản ánh *Featured*, không nói 'current trending'.
- [ ] **05.6 Failure isolation:** missing/invalid candidates, Redis down, fallback query errors; bounded timeout, no checkout calls. Không giả vờ fallback được khi PostgreSQL/Medusa unavailable.
- [ ] **05.7 Tests:** cases status 200/400/404/5xx, filtering, active version switch, no score/PII leak, no N+1, Redis failure, empty catalog; regression Cart/Checkout/Order.
- [ ] **05.8 Minimal telemetry:** count request, fallback_reason, latency, candidate count, errors — không log sensitive context/customer identifiers.

## 4. Files & evidence

- **New:** `apps/backend/src/api/store/recommendations/route.ts` và optional service/helper theo convention repo.
- **New tests:** `apps/backend/integration-tests/http/recommendations.spec.ts` (đường dẫn đúng theo project tests).
- **Docs:** `docs/recommendation/evidence/phase_05_api_test_report.md` với request/response đã che sensitive data.

## 5. Exit gate

- [ ] Home tối đa 12, PDP tối đa 6, API hard cap 24; tests reject invalid inputs.
- [ ] Region/price/sales channel/inventory được kiểm bằng Medusa, không trả invalid products.
- [ ] API **không N+1** và có giới hạn query/latency; 100 candidates chỉ là input pool không phải 100 DB requests.
- [ ] Redis/candidates failure có kết quả rõ; Medusa DB down trả lỗi an toàn.
- [ ] No customer ID/raw H&M ID/private score in response; no recommendation dependency in checkout flow.

**GO Phase 06:** HTTP integration suite pass với target commit và DB test riêng. **STOP:** invalid products hoặc failure làm sai cart/order.

## 6. Rollback/handoff

Tắt route/feature flag hoặc rollback active run; không xóa catalog. Backend owner bàn giao endpoint/schema/errors và test fixtures cho Frontend owner.
