<a id="data-06-report"></a>
# DATA-06 — Báo cáo Kiểm chứng Guardrail Gợi ý và Đồng ý Cá nhân hóa

**Ngày checkpoint:** 22/11/2026 (thực thi kiểm chứng local lúc 03:45–03:46 ngày 23/11/2026 giờ Việt Nam) · **Cơ sở Git:** `9b52ba07cd68df2232185e3fa283793f0e7a84fb` · **Nhánh:** `data-05-06-migration-rights-guardrails`.

Báo cáo ghi kết quả kiểm chứng DATA-06 trên PostgreSQL cục bộ cô lập. Phạm vi gồm cờ OFF, khách vãng lai, chưa đồng ý, cô lập khách A/B, thu hồi đồng ý và xóa vật lý event/profile, opt-in lại với epoch mới, từ chối lưu event epoch cũ, fallback và gọi trực tiếp job dựng hồ sơ.

Tài liệu kỹ thuật kèm theo: [Bảng Quyền Dữ liệu, Ma trận Cờ Tính năng và Điều kiện Bật](../technical/recommendation-rights-guardrails.md) · [Quyết định quyền dữ liệu gợi ý](../recommendation/dataset-rights-decision.md) · [Đặc tả cá nhân hóa](../recommendation/personalization/spec.md) · [Runbook cá nhân hóa](../recommendation/personalization/runbook.md).

Bằng chứng JSON đã làm sạch (không secrets, không PII): [test-results.json](evidence/recommendation-guardrails-2026-11-22/test-results.json).

<a id="environment-and-commands"></a>
## 1. Môi trường, suite đã dùng và lệnh chạy lại

- **Môi trường.** Windows, Node `24.21.0` (repo ghim `24.22.1`), npm `11.12.1`, Medusa `2.21.2` và PostgreSQL `18.4` cô lập tại `localhost:55433`. Cụm test được dọn sau lượt chạy. Hai suite đặt `REDIS_URL` trống và chạy không dùng Redis ngoài.
- **Suite HTTP và SHA-256 tại lượt chạy.**
  - [personalization-consent.spec.ts](../../apps/backend/integration-tests/http/personalization-consent.spec.ts) (`SHA-256: 2bbb9c0d47ee45627532301e4dc598dfdcb4c9c4b15733de11996cc4285be0c9`)
  - [recommendations.spec.ts](../../apps/backend/integration-tests/http/recommendations.spec.ts) (`SHA-256: a44a96745a1c2a4fd36441957fe62bb44d220eb59a61609c93d922b7147ea92d`)
- **Các lệnh kiểm chứng đã chạy từ gốc repo.** Khi tái lập lượt chạy HTTP, cung cấp `DB_HOST`, `DB_PORT`, `DB_USERNAME` và `DB_PASSWORD` của cụm thử nghiệm cô lập cho Medusa test runner.

```sh
npm run lint --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/backend
npm run test:unit --workspace=@dtc/backend
npm run build --workspace=@dtc/backend
npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/personalization-consent.spec.ts
npm run test:integration:http --workspace=@dtc/backend -- --runTestsByPath integration-tests/http/recommendations.spec.ts
```

Medusa test runner tạo, migrate và dọn database riêng cho từng file test. Ca kiểm thử gợi ý chỉ chạy migration down sau khi xác nhận database thuộc runner.

<a id="verification-results"></a>
## 2. Ma trận kỳ vọng và kết quả kiểm chứng

### 2.1. Kiểm tra tĩnh, unit và build backend

| Mã | Hạng mục | Kỳ vọng | Thực tế | Trạng thái |
| --- | --- | --- | --- | --- |
| **D06-S1** | `lint` backend | 0 lỗi, tuân thủ rule Medusa mặc định | 0 lỗi / cảnh báo | **PASS** |
| **D06-S2** | `typecheck` backend | `tsc --noEmit` thoát mã 0 | Thoát mã 0 | **PASS** |
| **D06-S3** | Unit tests backend (bao gồm policy/rank/consent/order-events) | Toàn bộ unit suite đạt | **13/13 suite, 121/121 test đạt** | **PASS** |
| **D06-S4** | Build backend & admin | Biên dịch thành công không lỗi | Backend 10,32s + Admin frontend 30,64s | **PASS** |

### 2.2. Kiểm chứng hành vi Guardrail & Consent trên PostgreSQL cô lập

| Mã | Kịch bản kiểm chứng | Suite / Cơ chế | Kỳ vọng | Thực tế quan sát | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| **D06-T1** | Cờ tính năng OFF (`ENABLE_RECOMMENDATIONS=false`) | `recommendations.spec.ts` | `GET /store/recommendations` trả HTTP `404` | HTTP `404` khi `ENABLE_RECOMMENDATIONS="false"` | **PASS** |
| **D06-T2** | Cờ cá nhân hóa và cờ sự kiện | `personalization-consent.spec.ts` | Tắt cả hai cờ khóa bốn thao tác API. Bật lại cờ cá nhân hóa cho phép đọc consent trong khi cờ riêng vẫn khóa ghi sự kiện. | Khi cả hai cờ OFF, GET/POST consent, POST events và GET for-you trả `404`. Khi bật lại riêng cờ cá nhân hóa, POST events vẫn trả `404` và GET consent trả `granted: false`. | **PASS** |
| **D06-T3** | Guest (không JWT khách hàng) | `personalization-consent.spec.ts` | Cả 4 endpoint cá nhân hóa trả HTTP `401` | HTTP `401` trên cả 4 endpoint (`GET/POST /consent`, `POST /events`, `GET /for-you`). | **PASS** |
| **D06-T4** | Khách đã đăng nhập chưa cấp consent | `personalization-consent.spec.ts` | Chặn ghi sự kiện và trả gợi ý danh mục với header ngăn lưu cache. | GET consent trả `granted: false`. POST events của B trả `403`. GET for-you trả `personalized: false`, `strategy: "catalog_fallback"`, `reason: "no_consent"` và `Cache-Control: private, no-store`. | **PASS** |
| **D06-T5** | Cô lập dữ liệu khách A/B | `personalization-consent.spec.ts` | Ràng buộc consent và thứ hạng gợi ý theo khách đã xác thực. | Consent của A không đổi trạng thái của B. API từ chối `customer_id` do client chèn vào lệnh cập nhật consent hoặc truy vấn for-you. A và B nhận hai sản phẩm đứng đầu khác nhau theo hai view riêng. | **PASS** |
| **D06-T6** | Thu hồi đồng ý của khách A | `personalization-consent.spec.ts` | Thu hồi tăng epoch, xóa vật lý event/profile của A và giữ dữ liệu của B. | Consent của A là `granted: false`, `epoch: 2`. Đọc trực tiếp thấy **0** event và **0** profile của A, **1** event và **1** profile của B. For-you của A trả fallback `no_consent`, còn B vẫn nhận cá nhân hóa. | **PASS** |
| **D06-T7** | Opt-in lại của khách A và gửi event theo epoch cũ | `personalization-consent.spec.ts` | Consent mới mở epoch mới. Event epoch cũ không được giữ trong DB. | Opt-in lại mở `epoch: 3` và trả fallback `cold_start_or_profile_pending` trước khi có hoạt động mới. Lời gọi `recordPersonalizationEventWorkflow` theo epoch 1 trả `accepted: false` và đọc lại thấy 0 dòng event của A. View mới qua API tạo event và profile epoch 3. For-you trả `personalized: true`. | **PASS** |
| **D06-T8** | Job dựng hồ sơ (`rebuildPersonalizationProfiles`) | `personalization-consent.spec.ts` | Sau khi xóa profile của A trong test, chỉ dựng lại profile khi bật `ENABLE_PERSONALIZATION_PROFILE_JOB`. | Gọi trực tiếp job với cờ OFF cho kết quả 0 profile của A. Với cờ ON, job tái tạo 1 profile ở epoch 3. Job hiện thiếu kiểm tra cờ cá nhân hóa chính. [Điểm chặn kỹ thuật](../technical/recommendation-rights-guardrails.md#feature-flag-matrix) | **PASS** |
| **D06-T9** | Fallback khi con trỏ trỏ tới run không tồn tại, publish/rollback gợi ý chung | `personalization-consent.spec.ts` + `recommendations.spec.ts` | For-you trả fallback danh mục khi run gặp lỗi. Gợi ý chung kiểm publish idempotent, rollback run, giá theo vùng, kênh, tồn kho/backorder và đầu vào. | For-you trả `200`, `personalized: false`, `strategy: "catalog_fallback"`, `reason: "candidate_store_unavailable"` và có sản phẩm. Gợi ý chung trả `catalog_featured` khi run thiếu và phục vụ lại phiên bản trước sau rollback con trỏ. Hai suite đạt **1/1 test** mỗi suite, lần lượt **27,276 s** và **49,341 s**. | **PASS** |
| **D06-E2E** | Kiểm thử trình duyệt E2E trên Storefront với cờ cá nhân hóa ON | Playwright E2E storefront | Xác minh giao diện consent trong Account, `ConsentAwareProductView` và khối For You end-to-end. | Chưa chạy trong checkpoint backend/DB tuần 1; cờ storefront đang giữ `OFF` mặc định. | **NOT RUN** |
| **D06-PURGE** | Job tự động xóa event/profile quá hạn | Chưa có scheduled job purge | Tự động purge theo mốc retention đã duyệt. Mốc 30 ngày cho event và 90 ngày cho profile đang ở mức đề xuất. | Chưa triển khai purge và chính sách retention (`OPEN-DATA-003`) chưa được phê duyệt. | **BLOCKED** |
| **D06-GATE** | Phê duyệt quyền dữ liệu & chính sách riêng tư để bật tính năng công khai | `OPEN-ASSET-001` & `OPEN-DATA-003` | Có hồ sơ bản quyền ảnh/dữ liệu hợp lệ và phê duyệt chính sách riêng tư/retention trước khi mở public/cloud. | Dữ liệu/ảnh H&M vẫn **NO-GO** cho public; 34 ảnh đại diện DAYMARK chưa có hồ sơ nguồn/giấy phép trong `manifest.json`; `OPEN-DATA-003` đang mở. **Giữ toàn bộ personalization OFF.** | **BLOCKED** |

<a id="remaining-blockers"></a>
## 3. Blocker còn mở, người phụ trách và bước tiếp theo

1. **`OPEN-ASSET-001` (Quyền dữ liệu H&M và giấy phép ảnh đại diện DAYMARK) — Chủ sở hữu dự án / Legal-Compliance Reviewer (Trung & Quý hỗ trợ đối soát manifest):**
   - Giữ H&M ở phạm vi nghiên cứu riêng tư/cục bộ; không dùng làm nguồn công khai.
   - Bổ sung nguồn/giấy phép cho 34 ảnh trong `apps/backend/assets/daymark-catalog/manifest.json` hoặc thay bằng bộ ảnh có bản quyền rõ ràng trước khi mở public S3.
2. **`OPEN-DATA-003` (Chính sách riêng tư, cơ sở pháp lý PDPD và mốc retention chính thức) — Chủ sở hữu dự án / Legal-Privacy Reviewer (Hoàng & Trung triển khai kỹ thuật sau khi duyệt):**
   - Chốt chính thức các mốc retention hiện còn ở mức đề xuất (30 ngày event / 90 ngày profile / 24 giờ guest / TBD order-derived).
   - Triển khai job tự động purge dữ liệu quá hạn, quy trình xuất/xóa dữ liệu khách hàng (DSAR), và bổ sung kiểm tra hai cờ (`ENABLE_PERSONALIZED_RECOMMENDATIONS && ENABLE_PERSONALIZATION_PROFILE_JOB`) trong `rebuild-personalization-profiles.ts`.
3. **Kiểm chứng còn lại trước khi cân nhắc mở khóa (Hoàng & Quân):**
   - Chạy lại suite HTTP trên Node `24.22.1` theo bản ghim. Dùng môi trường staging cô lập có worker và Redis thật để xác minh subscriber `personalization-order-events` khi có tải và khi sự kiện được phát lại.
   - Chạy Playwright E2E storefront với cờ ON trên môi trường staging cô lập và kiểm thử tải hỗn hợp có/không consent.
   - Cho tới khi toàn bộ các mục trên hoàn tất và được ký duyệt, **giữ `ENABLE_PERSONALIZED_RECOMMENDATIONS` và các cờ cá nhân hóa ở trạng thái `OFF`**.

<a id="handoff-recheck-2026-11-26"></a>
## 4. Kiểm chứng lại trước bàn giao ngày 26/11/2026

Lượt kiểm chứng dùng HEAD `9b52ba0` cùng hai file test có SHA-256 ghi ở mục 1, trên Windows, Node `24.21.0`, npm `11.12.1` và PostgreSQL `18.4` cô lập qua loopback. Runner dùng Redis giả lập. Cụm PostgreSQL test đã dừng sau lượt chạy.

- `lint`, `typecheck` và `build` workspace backend đều thoát mã `0`. Build gồm backend và Admin. Unit test đạt **13/13 suite, 121/121 test**.
- `test:integration:http` với `--runTestsByPath` cho cả hai file đạt **2/2 suite, 2/2 test** trong 77,521 giây. `personalization-consent.spec.ts` chạy 32,690 giây, `recommendations.spec.ts` chạy 43,379 giây.

Kiểm chứng Redis thật, E2E trình duyệt và xác nhận trên phiên bản Node ghim vẫn thuộc điều kiện mở tính năng ở mục 3.
