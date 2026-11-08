# Kế Hoạch Tối Ưu Hóa & Hoàn Thiện Recommender System MVP (Week 5)

> **Mã kế hoạch:** `REC-PDP-OPT-001`  
> **Nhánh:** `recommendation-pdp` $\rightarrow$ `main` (PR #9)  
> **Tác giả:** Senior Software Engineer phụ trách Recommender System  
> **Ngày lập:** 08/11/2026  
> **Trạng thái:** Đã phê duyệt, bắt đầu triển khai  

---

## 1. Bối Cảnh & Đánh Giá Hiện Trạng Thực Tế

Sau khi rà soát toàn bộ source code, PR diff 253 tệp, tài liệu kỹ thuật trong `docs/recommendation/` và các bằng chứng thực tế tại `docs/recommendation/pdp/evidence/pdp-load-verification.json`, hiện trạng kỹ thuật được xác lập như sau:

1. **Về tính đúng đắn chức năng (Functional Correctness):**
   - Đã có module Recommendation trong Medusa backend (`recommendation-run`, `recommendation-candidate`, `recommendation-active`).
   - Đã có Store API `GET /store/recommendations` phục vụ cho cả `home` (Popularity) và `product_detail` (Similar Products).
   - Đã có component `RelatedProducts` trên Storefront Next.js hiển thị tối đa 6 sản phẩm tương đồng, không trùng chính nó, có fallback khi thiếu hàng và ẩn thanh ray an toàn khi API gặp sự cố.
   - Toàn bộ unit tests (43/43 tests), python tests (34/34 tests), typecheck (2/2 packages) và build (backend + storefront) đều đạt PASS.
   - Nhánh `main` đã được merge vào `recommendation-pdp` tại commit `2f09dcd` với 0 xung đột.

2. **Về nút thắt hiệu năng (Performance Bottleneck):**
   - Trong bài kiểm thử tải k6 tại 30 RPS trong 60s (30 product contexts), cấu hình 1 replica gặp **HTTP error rate 48,83%** (880/1801 requests thất bại).
   - Toàn bộ 880 lỗi này đều là **HTTP 503** do chạm ngưỡng `capacity_rejections` (`inFlight >= maximum`).
   - Thời gian đáp ứng trung bình (avg latency) là ~296ms, p50 = 272ms, p95 = 732ms.
   - Khi chạy 3 replicas, lỗi giảm xuống 24,00% nhưng p95 tăng vọt lên 1.494ms và xuất hiện 5 dropped iterations do xung đột CPU và tài nguyên giữa các tiến trình.

---

## 2. Phân Tích Nguyên Nhân Gốc (Root Cause Analysis)

### 2.1. Nghịch lý Định luật Little & Ngưỡng Concurrency Quá Thấp
- **Định luật Little:** Trong hệ thống hàng đợi, số lượng request đồng thời trung bình cần có để duy trì thông lượng là:
  $$L = \lambda \times W$$
  Trong đó: $\lambda = 30 \text{ req/s}$ (tốc độ đến), $W = 0.296 \text{ s}$ (thời gian xử lý trung bình).
  $$L = 30 \times 0.296 = 8.88 \text{ in-flight requests}$$
- **Vấn đề cấu hình:** Trong file [apps/backend/src/api/store/recommendations/route.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/api/store/recommendations/route.ts#L139-L145), biến `RECOMMENDATION_MAX_CONCURRENCY` trong môi trường test được đặt cứng là **8** (`maximum = 8`).
- **Hệ quả:** Do $8 < 8.88$, dung lượng đồng thời của hệ thống bị bão hòa ngay từ giây đầu tiên. Bất kỳ request nào đến khi có từ 8 request đang xử lý đều bị trả về ngay HTTP 503:
  ```json
  { "message": "Recommendation capacity temporarily unavailable" }
  ```
  Đây là nguyên nhân trực tiếp dẫn tới 880 lượt từ chối (48,83%).

### 2.2. Chi Phí Hydration StoreProduct Quá Lớn & Thiếu Bộ Đệm Tĩnh
- Mỗi request đến endpoint `/store/recommendations` đều phải thực hiện:
  1. `req.scope.resolve(Modules.REGION).retrieveRegion(region)` (1 truy vấn DB).
  2. `service.listRecommendationActives(...)` (1 truy vấn DB).
  3. `service.retrieveRecommendationRun(...)` (1 truy vấn DB).
  4. `service.listRecommendationCandidates(...)` lấy 100 rows PDP (1 truy vấn DB).
  5. `service.listRecommendationCandidates(...)` lấy 100 rows Home fallback (1 truy vấn DB).
  6. Gọi `resolveStoreProducts` $\rightarrow$ `resolveNative` $\rightarrow$ chạy qua toàn bộ middleware và gọi `nativeGet` của Medusa Store Product API để tính toán giá và kho hàng.
- **Vấn đề của `coalesceAnonymous`:**
  File [apps/backend/src/modules/recommendation/coalesce.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/modules/recommendation/coalesce.ts) chỉ gom nhóm các promise *trong khi đang chạy* (`pending`). Do k6 test xoay vòng 30 product contexts khác nhau, các context hiếm khi trùng khớp nhau ở cùng một millisecond, khiến tỷ lệ hit của coalesce gần như bằng 0.
- Kết quả: CPU của tiến trình Node.js tăng lên 154%, khiến thời gian xử lý kéo dài và làm trầm trọng thêm tình trạng nghẽn dung lượng.

---

## 3. Rà Soát Phạm Vi 253 Tệp Trong PR #9 (Scope Review & Triage)

Tổng số 253 tệp thay đổi trong PR #9 được phân loại theo ranh giới kỹ thuật rõ ràng:

| Nhóm tệp | Thành phần | Tình trạng trong PR #9 | Đề xuất phân loại |
|---|---|---|---|
| **Recommendation MVP Core** | `apps/backend/src/modules/recommendation/`, `api/store/recommendations/route.ts`, workflows, scripts seed/publish, RelatedProducts trên Storefront | Hoàn thiện, có tests | **Giữ lại làm hạt nhân PR #9** |
| **Storefront PDP & Home UI** | `apps/storefront/src/modules/products/components/related-products/`, `apps/storefront/src/modules/home/components/popular-products/` | Hoàn thiện, có fallback | **Giữ lại làm hạt nhân PR #9** |
| **Personalization Module** | `apps/backend/src/modules/personalization/`, `for-you/route.ts`, `rebuild-personalization-profiles.ts`, consent | Đã đóng băng theo `v2-freeze.md` | Giữ nguyên cờ tắt, ghi nhận backlog giai đoạn sau |
| **Image Pipeline** | `scripts/hm/download-images.py`, `optimize-images.py`, `import-hm-images.ts` | Chưa có quyền public Kaggle | Giữ nguyên cờ tắt, không deploy ảnh thật lên public demo |
| **Visual & Hybrid Research** | `scripts/hm/build-visual-embeddings.py`, `hybrid_core.py`, `evaluate-hybrid.py` | Nghiên cứu offline | Giữ làm công cụ offline trong `scripts/hm/` |
| **Tài liệu & Báo cáo** | `docs/recommendation/pdp/`, `docs/recommendation/spec.md`, `evidence/` | Đầy đủ, minh bạch | Cập nhật số liệu sau tối ưu |

---

## 4. Kế Hoạch Triển Khai Tối Ưu Hóa (Action Tasks)

### Task 1: Bộ Đệm In-Memory Cho Active Run & Candidate IDs (Ưu tiên P0)
- **Vấn đề:** 4 câu lệnh truy vấn PostgreSQL lặp lại ở mọi request chỉ để lấy cùng một danh sách candidate IDs tĩnh của run hiện tại.
- **Giải pháp:**
  - Cache thông tin `active_run` và danh sách candidate IDs theo `(run_id, context_key)` trong bộ nhớ tiến trình (TTL 60 giây hoặc LRU cache kích thước 500 entries).
  - Tự động xóa cache khi có sự kiện publish run mới.
- **Tệp liên quan:** [apps/backend/src/api/store/recommendations/route.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/api/store/recommendations/route.ts).
- **Kỳ vọng:** Giảm 4 truy vấn DB trên mỗi request, giảm độ trễ xử lý candidate xuống dưới 1ms.

### Task 2: Tối Ưu Hóa Tầng StoreProduct Hydration & Short-Lived Safe Caching (Ưu tiên P0)
- **Vấn đề:** `resolveNative` gọi toàn bộ logic nặng của Medusa `store/products` lặp đi lặp lại.
- **Giải pháp:**
  - Trong `coalesce.ts`, bổ sung bộ đệm ngắn hạn (Short-lived cache TTL = 5 giây) cho các request ẩn danh có cùng query params (`region_id`, `id[]`, `fields`).
  - Đảm bảo 5 giây này đủ để hấp thụ hoàn toàn các đợt tải 30 RPS (mỗi giây 30 request thì 29 request được phục vụ từ cache), trong khi vẫn bảo đảm tính tươi mới của giá và tồn kho.
  - Cho phép vô hiệu hóa cache ngay lập tức khi phát hiện thay đổi hoặc trong các bài test integration.
- **Tệp liên quan:** [apps/backend/src/modules/recommendation/coalesce.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/modules/recommendation/coalesce.ts), [apps/backend/src/modules/recommendation/store-products.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/modules/recommendation/store-products.ts).
- **Kỳ vọng:** Giảm 90% tải CPU của Node.js, hạ thời gian phản hồi trung bình từ ~296ms xuống < 50ms.

### Task 3: Điều Chỉnh Ngưỡng Concurrency (`RECOMMENDATION_MAX_CONCURRENCY`) (Ưu tiên P1)
- **Vấn đề:** Concurrency cap = 8 quá nhỏ so với lưu lượng 30 RPS.
- **Giải pháp:**
  - Nâng `RECOMMENDATION_MAX_CONCURRENCY` mặc định từ 4/8 lên 32 (cho phép xử lý đồng thời tới 32 requests).
  - Với thời gian phản hồi sau tối ưu < 50ms, 30 RPS chỉ cần:
    $$L = 30 \times 0.05 = 1.5 \text{ in-flight requests}$$
    Ngưỡng 32 sẽ là tấm khiên an toàn tuyệt đối, loại bỏ hoàn toàn tình trạng `capacity_rejections` giả tạo.
- **Tệp liên quan:** [apps/backend/src/api/store/recommendations/route.ts](file:///d:/KieuQuy/Documents/E-commerce/apps/backend/src/api/store/recommendations/route.ts), [deploy/docker-compose.recommendation-test.yml](file:///d:/KieuQuy/Documents/E-commerce/deploy/docker-compose.recommendation-test.yml).

### Task 4: Đánh Giá Chất Lượng Gợi Ý Thực Tế (Ưu tiên P1)
- **Vấn đề:** Báo cáo cũ chưa có bảng đánh giá chi tiết chất lượng danh sách Top 6 của Similar Products và Popularity trên các sản phẩm mẫu.
- **Giải pháp:**
  - Viết script đánh giá chất lượng gợi ý trên các sản phẩm đại diện (áo, quần, túi, bình nước, phụ kiện):
    - Kiểm tra tính liên quan (cùng danh mục / phong cách).
    - Kiểm tra số lượng (Top 6).
    - Kiểm tra không trùng lặp (duplicates = 0).
    - Kiểm tra không gợi ý chính mình (self-recommendation = 0).
    - Kiểm tra tính khả dụng (toàn bộ sản phẩm đều có giá VND và mua được).
  - Xuất báo cáo đánh giá vào `docs/recommendation/pdp/reports/recommendation-evaluation-report.md`.

### Task 5: Kiểm Thử Toàn Diện & Đo Lường Lại Benchmark (Ưu tiên P0)
- **Quy trình kiểm thử:**
  1. Chạy Backend Unit Tests (`npm run test:unit --workspace=@dtc/backend`).
  2. Chạy Python Offline Tests (`python -m unittest discover -s scripts/hm/tests`).
  3. Chạy HTTP Integration Tests (`recommendations.spec.ts`, `auth-catalog-search.spec.ts`).
  4. Chạy Lint & Typecheck (`turbo lint`, `turbo typecheck`).
  5. Chạy k6 load test tại 30 RPS trong 60s và ghi nhận số liệu so sánh trước / sau.
- **Tệp liên quan:** `load/recommendations.js`, `docs/recommendation/pdp/evidence/`.

### Task 6: Cập Nhật Tài Liệu, Evidence & PR #9 Description (Ưu tiên P1)
- Cập nhật báo cáo hiệu năng so sánh trước và sau tối ưu: `docs/recommendation/pdp/reports/performance-report.md`.
- Cập nhật nội dung PR #9 Description với đầy đủ bằng chứng kiểm thử, các điểm cải thiện và các backlog còn lại.

---

## 5. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] **Độ chính xác nghiệp vụ:** Giữ nguyên 100% Medusa Core, giá VND đúng theo region, tồn kho chính xác, không rò rỉ dữ liệu nhạy cảm.
- [ ] **Chất lượng gợi ý:** 100% không self-recommendation, 100% không duplicate, đúng tối đa 6 sản phẩm, fallback hoạt động trơn tru.
- [ ] **Hiệu năng chịu tải tại 30 RPS (60s):**
  - HTTP Error Rate < 1% (mục tiêu: 0%).
  - p95 latency < 800ms (mục tiêu: < 300ms).
  - Dropped iterations = 0.
  - Capacity rejections = 0.
- [ ] **Chất lượng mã nguồn:** Lint 0 errors, Typecheck 0 errors, Unit tests 100% pass, Integration tests 100% pass.
- [ ] **Tài liệu minh bạch:** Có đầy đủ bảng so sánh trước/sau, báo cáo đánh giá chất lượng gợi ý và mô tả PR hoàn chỉnh.

