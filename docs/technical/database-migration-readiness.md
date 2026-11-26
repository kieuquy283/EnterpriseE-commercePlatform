<a id="data-05-database-migration-readiness"></a>
# DATA-05 — DB Readiness, Kế hoạch Migration và Quy trình Quay lui / Phục hồi

**Ngày lập:** 22/11/2026 (lượt kiểm chứng local hoàn tất lúc 03:32–03:46 ngày 23/11/2026 giờ Việt Nam) · **Cơ sở Git:** `9b52ba07cd68df2232185e3fa283793f0e7a84fb` (nhánh `data-05-06-migration-rights-guardrails`) · **Medusa:** `2.21.2`.

Tài liệu này chốt trạng thái sẵn sàng cơ sở dữ liệu (DB readiness), danh mục migration đầy đủ, kế hoạch chạy migration có backup/readback và tiêu chí dừng, đồng thời tách rõ **quay lui phiên bản ứng dụng** với **phục hồi schema/dữ liệu**. Bằng chứng chạy thực tế và báo cáo truy vấn local nằm tại [Báo cáo DATA-05 ngày 22/11/2026](../report/database-migration-query-2026-11-22.md).

Đối chiếu tài liệu nguồn: [Baseline schema DATA-01](database-baseline.md) · [Hợp đồng dữ liệu và API](../spec/04-data-api.md) · [Kế hoạch kiểm thử](../spec/05-testing.md) · [Thiết lập môi trường](../setup.md) · [Runbook triển khai AWS](../../deploy/RUNBOOK.md) · [CloudFormation stack](../../deploy/cloudformation/README.md).

<a id="db-readiness-summary"></a>
## 1. Tổng quan DB readiness theo môi trường

| Môi trường | Phiên bản PostgreSQL / Redis | Trạng thái migration | Trạng thái sẵn sàng | Giới hạn / Phần chưa biết |
| --- | --- | --- | --- | --- |
| **PostgreSQL local cô lập (đã kiểm chứng)** | PostgreSQL `18.4` (cụm tạm chỉ bind loopback `localhost:55433`, xóa sau kiểm chứng); `REDIS_URL` trống (fake/in-memory Redis) | **186** `mikro_orm_migrations` (182 core + 4 custom) + **20** `link_module_migrations`, **0 pending** khi chạy lại; **153** bảng `public`, **617** index. Xem ghi chú `186` vs `187` khi bật `REDIS_URL` ở mục 2. | **PASS** cho cài mới, chạy lặp idempotent, nâng cấp từ schema trước (Drill A & B) và kiểm tra `pg_restore` sang DB mới. | Node chạy kiểm chứng là `24.21.0` (repo ghim `24.22.1`); chưa kiểm với Redis thật và chưa có tải đa tiến trình. |
| **PostgreSQL local có Redis thật (tham chiếu DATA-02 ngày 18/11)** | PostgreSQL `17.10` + Redis `7.4.11` (Docker tạm loopback) | **187** migration đã áp dụng trên baseline `1b6a668d` ([báo cáo DATA-02](../report/daymark-catalog-validation-2026-11-18.md)). | **PASS lịch sử** cho bootstrap + nhập danh mục 30 sản phẩm. | Khác 1 migration của `@medusajs/workflow-engine-redis` so với chế độ không Redis. |
| **AWS RDS cloud (`commerce`, `ap-southeast-2`)** | Lịch sử 09/11/2026: RDS PostgreSQL `16.15` (`db.t4g.micro`, Single-AZ, `BackupRetentionPeriod: 1`, `DeletionProtection: true`) + Redis tự quản lý trên EC2 (`appendonly yes`). | **CHƯA BIẾT / NOT VERIFIED tại 22/11/2026.** Bằng chứng lịch sử ngày 09/11/2026 ([báo cáo AWS 09/11](../report/aws-redeployment-main389e855-2026-11-09.md), [migrations.json](../report/evidence/fargate-main389e855-2026-11-09/migrations.json)) ghi nhận cả 4 custom migration đã từng chạy trên commit `389e855`. | **CHƯA XÁC MINH** cho trạng thái live hiện tại (không thao tác AWS trong DATA-05; xác minh dữ liệu cloud thuộc Tuần 2). | Chưa xác minh live tại 22/11: trạng thái instance/lease RDS, bảng `mikro_orm_migrations` thực tế, drift dữ liệu/catalog/đơn hàng, độ mới của snapshot RDS và trạng thái Redis AOF. |

<a id="migration-inventory"></a>
## 2. Đối chiếu migration trong mã và trạng thái áp dụng

### 2.1. Tổng quan số lượng và lưu ý `REDIS_URL`

1. **Migration custom do DAYMARK sở hữu (4 tệp, giữ nguyên không sửa lịch sử):**
   - `apps/backend/src/modules/recommendation/migrations/Migration20261103195231.ts`
   - `apps/backend/src/modules/personalization/migrations/Migration20261107144837.ts`
   - `apps/backend/src/modules/personalization/migrations/Migration20261107150232.ts`
   - `apps/backend/src/modules/personalization/migrations/Migration20261107151743.ts`
2. **Custom module links trong repo (`apps/backend/src/links/`):** `0` tệp. Toàn bộ **20** `link_module_migrations` đến từ core Medusa `@medusajs/link-modules` `2.21.2`.
3. **Migration mục tiêu chưa tồn tại trong mã:** `NotificationIntent` (FR-08 / BE-04) **chưa có** model hoặc migration; trên DB đã kiểm chứng, bảng `notification_intent` là `false` (không tồn tại).
4. **Lưu ý quan trọng về lệch số đếm `186` vs `187` theo `REDIS_URL`:**
   - Trong [apps/backend/medusa-config.ts](../../apps/backend/medusa-config.ts), khi `REDIS_URL` được đặt, Medusa nạp `@medusajs/workflow-engine-redis` (có **8** migration); khi `REDIS_URL` trống, Medusa rơi về `@medusajs/workflow-engine-inmemory` (có **7** migration).
   - Hệ quả vận hành:
     - Trên DB cài mới với `REDIS_URL=""` → **186** `mikro_orm_migrations` (182 core + 4 custom).
     - Trên DB cài mới hoặc AWS có `REDIS_URL` → **187** `mikro_orm_migrations` (183 core + 4 custom).
   - **Quy tắc:** Khi chạy `medusa db:migrate` cho môi trường đích (đặc biệt trên AWS Fargate/EC2 có Redis), luôn truyền đúng `REDIS_URL` của môi trường đó để bảng workflow-engine khớp runtime.

### 2.2. Chi tiết 4 migration custom và tính tương thích ngược

| Migration | Module | Thay đổi DDL | Tính tương thích ngược với phiên bản ứng dụng trước | Trạng thái trên DB local đã kiểm | Trạng thái trên AWS RDS (22/11/2026) |
| --- | --- | --- | --- | --- | --- |
| `Migration20261103195231` | `recommendation` | Tạo 3 bảng `recommendation_run`, `recommendation_candidate`, `recommendation_active` cùng PK, partial unique index và CHECK trạng thái. | **Tương thích ngược (additive).** Chỉ thêm bảng mới; mã cũ không đọc/ghi các bảng này. | Đã áp dụng (fresh & Drill A); pending = 0 sau chạy. | Lịch sử 09/11: đã chạy; **live 22/11: CHƯA BIẾT**. |
| `Migration20261107144837` | `personalization` | Tạo bảng `recommendation_consent` (`customer_id` unique khi `deleted_at IS NULL`, `epoch >= 1`). | **Tương thích ngược (additive).** Chỉ thêm bảng mới. | Đã áp dụng (fresh & Drill A); pending = 0 sau chạy. | Lịch sử 09/11: đã chạy; **live 22/11: CHƯA BIẾT**. |
| `Migration20261107150232` | `personalization` | Tạo bảng `recommendation_event` (10 cột, CHECK `('product_view', 'recommendation_click')`) và `recommendation_profile`. | **Tương thích ngược (additive).** Chỉ thêm bảng mới. | Đã áp dụng (fresh & Drill A); pending = 0 sau chạy. | Lịch sử 09/11: đã chạy; **live 22/11: CHƯA BIẾT**. |
| `Migration20261107151743` | `personalization` | Thêm `occurred_at timestamptz` (backfill `occurred_at = created_at`, sau đó `SET NOT NULL`), thêm `order_line_key text NULL`, mở rộng CHECK `event_type` thêm `'order_placed'`, `'order_canceled'`. | **Có điều kiện.** Drill B đối soát thành công 3/3 dòng cũ sau backfill. Bản ứng dụng trước migration sẽ lỗi khi ghi `recommendation_event` vì `occurred_at` là `NOT NULL` và không có `DEFAULT` ở DB. Chỉ quay lại bản đó nếu đã xác minh mọi đường ghi theo schema cũ đều tắt, trong đó có `ENABLE_PERSONALIZATION_EVENTS=false`. | Đã áp dụng (fresh, Drill A, Drill B); pending = 0 sau chạy. | Lịch sử 09/11: đã chạy; **live 22/11: CHƯA BIẾT**. |

<a id="migration-execution-plan"></a>
## 3. Kế hoạch chạy migration an toàn (Backup, Readback và Tiêu chí dừng)

Trung bàn giao danh sách migration, đánh giá tương thích ngược, tiêu chí backup/readback và bằng chứng local. Thắng điều phối phát hành, cửa sổ bảo trì và thực thi migration AWS theo [Runbook triển khai AWS](../../deploy/RUNBOOK.md#publish-and-release). Các bước AWS dưới đây là kế hoạch bàn giao cho đợt được phê duyệt, chưa được thực hiện trong DATA-05.

### 3.1. Điều kiện tiên quyết trước khi chạy (Pre-flight)

1. **Xác định mục tiêu và revision:** Chốt commit SHA, digest ảnh Docker (`backend`), danh sách migration mới dự kiến áp dụng và tính tương thích ngược (expand-only hay cần dừng ghi).
2. **Diễn tập bắt buộc trên DB local cô lập trước:** Chạy thử từ bản dump ẩn danh / schema baseline trước đó sang phiên bản mới, đối chiếu readback trước–sau (số dòng, giá trị mẫu, ràng buộc) và chạy suite tích hợp liên quan.
3. **Đóng luồng ghi trong cửa sổ bảo trì AWS.** Theo runbook, `pause` rút các task ứng dụng, kết thúc lease và yêu cầu dừng cả RDS/Redis. `plan app` và `apply` change set đã duyệt đưa digest mới vào app stack với số task ứng dụng bằng 0. Dùng `start-data` với lease được duyệt để đưa riêng RDS/Redis về trạng thái sẵn sàng cho backup, readback và one-off task. Xác nhận API, worker, storefront và các nguồn ghi khác đã dừng trước khi lấy baseline.
4. **Sao lưu bắt buộc trước migration:**
   - **Local / staging tự quản lý:** `pg_dump -Fc --no-owner --no-acl -f <backup_file>.dump "$DATABASE_URL"`, kiểm tra tệp dump > 0 byte và đọc mục lục bằng `pg_restore --list <backup_file>.dump`.
   - **AWS RDS (`commerce`).** Tạo manual snapshot trên instance đã xác nhận, ghi revision và thời điểm UTC, rồi chờ trạng thái `available` trước khi tiếp tục. Giữ snapshot và baseline cho đến khi hoàn tất kiểm chứng phát hành.
5. **Chụp baseline readback trước migration:** Ghi nhận số dòng các bảng lõi (`mikro_orm_migrations`, `link_module_migrations`, `product` theo `status`, `product_variant`, `price`, `inventory_level` + tổng `stocked_quantity` / `reserved_quantity`, `order`, `payment`, và các bảng custom `recommendation_*`), không xuất PII khách hàng.

### 3.2. Thực thi migration và đọc lại kiểm chứng (Post-migration Readback)

1. Chạy migration sau khi hoàn thành các bước backup và readback trước migration:
   - **Local.** Từ `apps/backend`, chạy `npm exec -- medusa db:migrate` với `DATABASE_URL` và `REDIS_URL` tương ứng môi trường cô lập.
   - **AWS Fargate.** Với app stack đang ở 0 task và lease còn hiệu lực, Thắng chạy `python3 deploy/cloudformation/manage.py task migrate` bằng task definition của digest đã duyệt. Ghi task ARN, mã thoát và log CloudWatch đã làm sạch. [Hướng dẫn CloudFormation](../../deploy/cloudformation/README.md#reviewed-deployment-and-bootstrap)
2. **Kiểm tra nhật ký migration:** Chỉ các migration dự kiến xuất hiện trong danh sách vừa chạy; không có lỗi SQL, lock timeout hoặc rollback nửa chừng.
3. **Chụp readback sau migration và so sánh với baseline trước migration:**
   - Tổng số `mikro_orm_migrations` tăng đúng bằng số migration mới; tên migration mới có mặt trong bảng.
   - Chạy lại `medusa db:migrate` (nếu kiểm tra idempotency ở staging/local) báo `Skipped. Database is up-to-date`.
   - Toàn bộ số đếm và tổng đối soát dữ liệu kinh doanh lõi (`products_published`, `variants`, `prices`, `stocked_quantity_sum`, `reserved_quantity_sum`, số đơn hàng/thanh toán) không sụt giảm ngoài dự kiến.
   - Các cột/bảng/ràng buộc mới tồn tại đúng định nghĩa (`information_schema.columns`, `pg_constraint`, `pg_indexes`), các bản ghi backfill không bị `NULL` sai quy tắc.
4. **Mở lưu lượng sau khi readback đạt.** Thắng chạy `start` theo runbook, vẫn với đúng digest đã đối soát. `start` tự chạy migration trước khi bật dịch vụ. Lượt này dự kiến không có migration chờ và phải thành công mới bật được app. Sau đó kiểm chứng `/health`, Store API catalog và các luồng nghiệp vụ theo checklist phát hành.

### 3.3. Tiêu chí dừng (Stop / Abort Criteria)

Dừng ngay tiến trình phát hành và **không** mở lưu lượng mới nếu xuất hiện bất kỳ dấu hiệu nào sau đây:

| Mã | Điều kiện dừng | Hành động bắt buộc |
| --- | --- | --- |
| **STOP-01** | Không tạo được bản sao lưu (`pg_dump` thất bại / rỗng, hoặc RDS manual snapshot chưa đạt `available`). | **Hủy chạy migration.** Tuyệt đối không chạy DDL khi chưa có bản sao lưu đã xác minh. |
| **STOP-02** | Danh sách migration chờ chạy trên DB đích khác với kế hoạch (xuất hiện migration ngoài dự kiến, thiếu migration cũ hoặc phát hiện drift schema). | **Dừng trước khi chạy.** Đối chiếu `mikro_orm_migrations` giữa DB đích và Git/lockfile trước khi quyết định. |
| **STOP-03** | `medusa db:migrate` thoát mã khác `0`, gặp lỗi lock/deadlock, timeout hoặc lỗi constraint. | **Giữ các task ứng dụng ở 0.** Lưu log lỗi và đối chiếu `mikro_orm_migrations` trong lease còn hiệu lực. Thắng quản lý việc dừng RDS/Redis theo runbook khi kết thúc kiểm tra. Giữ nguyên dữ liệu và không tự động chạy `db:rollback`. |
| **STOP-04** | Readback sau migration phát hiện mất dòng, sai tổng tồn kho/đơn hàng, backfill còn `NULL` hoặc sai ràng buộc. | **Giữ các task ứng dụng ở 0.** Đối soát sai lệch, đánh giá bản vá tiến tới hoặc phục hồi vào DB mới theo mục 4.2. |
| **STOP-05** | Ứng dụng mới không vượt qua `/health` hoặc lỗi truy vấn DB ngay sau khi `start`. | Chuyển sang quy trình quay lui ứng dụng (mục 4.1) nếu schema tương thích ngược, hoặc giữ dừng và phục hồi dữ liệu (mục 4.2) nếu schema không tương thích. |

<a id="rollback-vs-recovery"></a>
## 4. Tách biệt quay lui phiên bản ứng dụng và phục hồi schema / dữ liệu

Hai quy trình dưới đây **không được đánh đồng**. Nguyên tắc bắt buộc của DAYMARK: **không tự động chạy `medusa db:rollback` trên cơ sở dữ liệu thật hoặc dùng chung**, và **không phục hồi (restore) đè trực tiếp lên DB đang chạy/dùng chung**.

### 4.1. Quay lui phiên bản ứng dụng (Application Version Rollback)

- **Khi nào áp dụng:** Phiên bản ứng dụng mới gặp lỗi logic/HTTP/hiệu năng sau phát hành, nhưng **schema hiện tại trên PostgreSQL vẫn tương thích ngược** với phiên bản ứng dụng trước đó (các thay đổi chỉ mang tính bổ sung bảng/cột nullable hoặc cột có giá trị mặc định, và chưa có dữ liệu phá vỡ hợp đồng của bản cũ).
- **Thực hiện trên AWS Fargate theo runbook.** Trung xác nhận ứng dụng cũ đọc/ghi được trên schema hiện có, kể cả điều kiện cờ ở mục 2.2. Thắng dùng digest ECR ổn định trước đó với cấu hình cờ tương ứng. Trình tự phát hành quay lui gồm `pause`, `plan app`, `apply` change set đã duyệt và `start` với lease phù hợp. Giữ nguyên schema và dữ liệu. Kiểm chứng `/health`, Store API catalog, log CloudWatch và smoke nghiệp vụ đã được duyệt. [Runbook phát hành](../../deploy/RUNBOOK.md#publish-and-release)

### 4.2. Phục hồi schema và dữ liệu (Schema / Data Recovery)

- **Khi nào áp dụng:** Migration thất bại để lại trạng thái schema hỏng/nửa chừng không tương thích ngược, readback sau migration phát hiện sai lệch hoặc mất dữ liệu, hoặc phát sinh hỏng dữ liệu không thể sửa an toàn bằng bản vá tiến tới (forward-fix).
- **Trình tự thực hiện (Isolated Restore → Readback → Controlled Cutover):**
  1. **Giữ nguyên DB nguồn để điều tra.** Giữ các task ứng dụng ở 0 để chặn ghi. Thắng quản lý lease và trạng thái dịch vụ dữ liệu theo runbook khi cần readback trên hệ thống còn giữ lại.
  2. **Phục hồi vào một cơ sở dữ liệu MỚI hoàn toàn cô lập:**
     - **Local / tự quản lý:** Tạo database mới riêng biệt (`CREATE DATABASE <recovery_db>;`), chạy `pg_restore --no-owner --no-acl -d <recovery_db> <pre_migration_backup>.dump`. (Đã diễn tập thành công với bản dump 531.928 byte sang `daymark_data05_restore_check` trong báo cáo DATA-05.)
     - **AWS RDS.** Với phê duyệt phục hồi, dùng manual snapshot trước migration hoặc mốc phục hồi nằm trong cửa sổ backup đã xác minh. Tạo **RDS instance mới**, truy cập riêng tại `ap-southeast-2` để kiểm chứng trước khi phục vụ ứng dụng. Thắng xác nhận mạng, thời hạn vận hành và phạm vi CloudFormation theo runbook.
  3. **Chạy readback đối soát trên DB phục hồi:** Xác minh `mikro_orm_migrations`, số lượng sản phẩm/SKU/tồn kho, đơn hàng, thanh toán và toàn vẹn ràng buộc khớp baseline trước sự cố.
  4. **Cắt chuyển có kiểm soát.** Đối soát các bản ghi phát sinh sau mốc backup, trạng thái Redis và dữ liệu media trước khi mở ghi. Thắng lập change set theo runbook cho kết nối ứng dụng tới DB đã kiểm chứng và chọn digest tương thích. Kiểm tra sức khỏe, đối soát sau cắt chuyển và giữ DB nguồn cùng backup cho hậu kiểm. [Hướng dẫn phục hồi CloudFormation](../../deploy/cloudformation/README.md#pause-hibernate-and-recovery)
- **Ranh giới dữ liệu ngoài PostgreSQL (cần kiểm soát riêng khi phục hồi):**
  - **Redis (`deploy/cloudformation/data.yaml`).** RDS snapshot chỉ chứa PostgreSQL. Redis giữ cache, event bus, workflow và khóa trên AOF lưu bền. Bảo toàn AOF và đối soát các sự kiện/workflow/khóa có thể lệch mốc PostgreSQL trước khi bật lại các consumer. Khi cần làm mới cache, giới hạn ở các mục cache đã nhận diện và dùng cơ chế đã kiểm chứng của ứng dụng. [Hướng dẫn phục hồi CloudFormation](../../deploy/cloudformation/README.md#pause-hibernate-and-recovery)
  - **S3 ảnh (`data.yaml`):** Lưu tệp media với versioning bật và giữ phiên bản không hiện hành 7 ngày — độc lập với RDS snapshot. Kiểm tra lại đường dẫn ảnh của sản phẩm sau khôi phục nếu sự cố có kèm thay đổi media.
  - **Bảo vệ chống mất dữ liệu cục bộ:** Theo [docs/setup.md](../setup.md), không chạy `docker compose down -v` trên môi trường giữ dữ liệu cần bảo toàn.

<a id="week-2-cloud-handoff"></a>
## 5. Phần để lại cho Tuần 2 (Xác minh dữ liệu AWS và Benchmark 1.000 sản phẩm)

1. **Xác minh live AWS RDS (`commerce`, `ap-southeast-2`) — Tuần 2.** Thắng phụ trách môi trường, lease và phát hành. Trung cung cấp danh mục migration và đối soát dữ liệu cùng Thắng qua phiên được duyệt. Kết quả live chưa có trong DATA-05.
   - Đối chiếu `mikro_orm_migrations` với digest của môi trường đích. Baseline cùng Medusa `2.21.2` có Redis dự kiến 187 migration, gồm 4 custom migration.
   - Kiểm tra độ mới snapshot/automated backup, trạng thái `DeletionProtection`, trạng thái Redis AOF và số liệu dữ liệu catalog/đơn hàng hiện có mà không ghi sửa.
2. **Đánh giá lại index ở quy mô 1.000 sản phẩm — Tuần 2:**
   - Kết quả DATA-05 ở quy mô 153 sản phẩm / 713 biến thể cho thấy **chưa cần thêm index PostgreSQL tùy chỉnh** (xem [báo cáo truy vấn DATA-05](../report/database-migration-query-2026-11-22.md#index-decision)).
   - Tuần 2 chạy lại `EXPLAIN (ANALYZE, BUFFERS)` ở 1.000 sản phẩm để đánh giá riêng `ILIKE` tìm kiếm (`pg_trgm`), lọc theo category (`product_category_product(product_category_id, product_id)`) và bài toán tải nhiều lô theo giá của storefront (`listProductsWithSort`).
