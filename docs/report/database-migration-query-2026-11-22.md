<a id="data-05-report"></a>
# DATA-05 — Báo cáo Kiểm chứng Migration, Readback và Truy vấn Local

**Ngày checkpoint:** 22/11/2026 (thực thi kiểm chứng local lúc 03:32–03:46 ngày 23/11/2026 giờ Việt Nam) · **Cơ sở Git:** `9b52ba07cd68df2232185e3fa283793f0e7a84fb` · **Nhánh:** `data-05-06-migration-rights-guardrails`.

Báo cáo này ghi lại toàn bộ kết quả chạy thực tế trên PostgreSQL cục bộ cô lập cho phạm vi **DATA-05**: (1) đối chiếu migration trên DB cài mới và nâng cấp từ schema trước kèm readback trước/sau và diễn tập `pg_restore` sang DB mới; (2) phân tích `EXPLAIN (ANALYZE, BUFFERS)` cho các truy vấn catalog, tìm kiếm, lọc và sắp xếp trên fixture **153 sản phẩm published** (gồm **120 sản phẩm tổng hợp** khớp truy vấn); và (3) quyết định index dựa trên số đo thực tế.

Tài liệu kỹ thuật kèm theo: [DB Readiness, Kế hoạch Migration và Quay lui / Phục hồi](../technical/database-migration-readiness.md) · [Baseline schema DATA-01](../technical/database-baseline.md) · [Kế hoạch kiểm thử](../spec/05-testing.md) · [Runbook AWS](../../deploy/RUNBOOK.md).

Bằng chứng JSON đã làm sạch (không secrets, không PII, đã che khóa publishable tạm):
- [migration-readback.json](evidence/database-migration-query-2026-11-22/migration-readback.json)
- [query-explain-summary.json](evidence/database-migration-query-2026-11-22/query-explain-summary.json)

<a id="environment-and-fixtures"></a>
## 1. Môi trường, cấu hình và quy mô fixture

- **Hệ điều hành & runtime:** Windows; Node `24.21.0` (**lưu ý minh bạch:** repo ghim `24.22.1` tại `package.json` — cần chạy lại trên đúng `24.22.1` khi dùng cho cổng phát hành); npm `11.12.1`; Medusa `2.21.2`.
- **Cơ sở dữ liệu cô lập:** Cụm PostgreSQL `18.4` (`PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35227, 64-bit`) khởi tạo tạm trong thư mục `%TEMP%`, bind riêng loopback `localhost:55433`, hoàn toàn độc lập với dịch vụ hệ thống (cổng `5432` không bị chạm tới) và được dừng/xóa ngay sau khi kết thúc kiểm chứng.
- **Redis:** `REDIS_URL=""` (sử dụng fake/in-memory Redis của Medusa; giải thích rõ số đếm `186` migration thay vì `187` khi bật `REDIS_URL`, xem [DB Readiness](../technical/database-migration-readiness.md#migration-inventory)).
- **Ba nhóm kiểm chứng trên cụm tạm:**
  1. `daymark_data05_fresh`: kiểm chứng cài mới từ DB trống và chạy lặp idempotency.
  2. `daymark_data05_upgrade` + `daymark_data05_restore_check`: kiểm chứng nâng cấp từ schema trước (Drill A & Drill B) trên bộ 33 sản phẩm published (3 bootstrap + 30 DAYMARK, 233 biến thể, 234 giá VND, 2.609 đơn vị tồn) cùng bản ghi cá nhân hóa tổng hợp và diễn tập `pg_restore` sang DB mới tách biệt.
  3. `daymark_data05_perf120`: kiểm chứng truy vấn trên **153 sản phẩm published** thuộc kênh `Online Store` (3 bootstrap + 30 DAYMARK + **120 sản phẩm tổng hợp** `dm-perf-001..dm-perf-120`, mỗi sản phẩm 4 biến thể = 480 biến thể tổng hợp → tổng **713 biến thể, 714 giá VND, 713 mức tồn**), chạy `VACUUM ANALYZE` trước khi đo.

<a id="verification-matrix"></a>
## 2. Ma trận kết quả kiểm chứng DATA-05

| Mã | Hạng mục kiểm chứng | Lệnh / Cơ chế chính | Kỳ vọng | Thực tế đo được | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| **D05-M1** | Cài mới trên DB trống (`daymark_data05_fresh`) | `npm exec -- medusa db:migrate` (`REDIS_URL=""`) | Tạo `mikro_orm_migrations`, áp dụng đủ core + 4 custom migration + 20 link migration; không tạo `notification_intent`. | Trước chạy: `mikro_orm_migrations = ABSENT`. Sau chạy: **186** `mikro_orm_migrations` (182 core + 4 custom), **20** `link_module_migrations`, **153** bảng `public`, **617** index; 6 bảng `recommendation_*` tồn tại; `notification_intent = false`. | **PASS** |
| **D05-M2** | Chạy lại migration (idempotency) | Chạy lại `npm exec -- medusa db:migrate` lần 2 | 0 migration pending; mọi module báo `Skipped. Database is up-to-date`; tổng số dòng giữ nguyên. | 0 migration pending; tổng `mikro_orm_migrations` giữ nguyên **186**. | **PASS** |
| **D05-M3** | Nâng cấp Drill A: Schema thương mại lõi (182) → thêm 4 custom migration (186) | Seed 33 SP / 233 biến thể / 2.609 tồn ở mốc 182 (sau khi gỡ 4 custom trên DB tạm) → `pg_dump -Fc` → `medusa db:migrate` | Chỉ chạy đúng 4 custom migration (`Migration20261103195231`, `144837`, `150232`, `151743`); 100% dữ liệu thương mại giữ nguyên. | Chỉ 4 custom migration chạy; tổng tăng `182 → 186`; 6 bảng `recommendation_*` được tạo; readback trước = sau: **33** SP published, **233** biến thể, **234** giá VND, **233** mức tồn, **2.609** tổng tồn, 5 handle mẫu khớp 100%. | **PASS** |
| **D05-M4** | Nâng cấp Drill B: Tiến hóa tại chỗ `recommendation_event` (`150232` → `151743`) | Ở mốc 185 (pending đúng 1 migration `151743`), chèn 2 consent, 3 event (`product_view`/`recommendation_click`), 1 profile tổng hợp → `pg_dump -Fc` (**531.928 byte**) → `medusa db:migrate` | Chỉ chạy `Migration20261107151743`; thêm `occurred_at NOT NULL` & `order_line_key NULL`; backfill `occurred_at = created_at` cho 3/3 event; mở rộng CHECK sang 4 loại; chèn mới `order_placed` thành công; giữ nguyên catalog/tồn. | Chỉ `Migration20261107151743` chạy; cột bảng `recommendation_event` tăng `10 → 12`; **3/3** event cũ có `occurred_at = created_at` và `order_line_key = null`; CHECK mở rộng thành `('product_view','recommendation_click','order_placed','order_canceled')`; chèn mới `order_placed` trả `1` dòng; 33 SP / 2.609 tồn giữ nguyên. | **PASS** |
| **D05-M5** | Diễn tập phục hồi `pg_restore` sang DB mới tách biệt | `pg_restore --no-owner --no-acl -d daymark_data05_restore_check <dump>` | Phục hồi nguyên vẹn trạng thái tiền nâng cấp Drill B mà không chạm DB nguồn. | DB mới `daymark_data05_restore_check` đọc lại chính xác: **185** migration (3 custom), **33** SP published, **233** biến thể, **2.609** tồn, **3** event, **2** consent, **1** profile. | **PASS** |
| **D05-Q1..Q9** | Đo HTTP + `EXPLAIN (ANALYZE, BUFFERS)` 9 ca catalog/sort/tìm/lọc trên 153 SP (120 tổng hợp) | Backend Medusa chạy loopback + `log_min_duration_statement=0` + chạy lại `EXPLAIN (ANALYZE, BUFFERS)` qua `psql` | Ghi số đo HTTP, SQL và JS sort theo từng phép đo. Dùng plan và buffer thu được để đánh giá index, có ghi ngoại lệ. | Hoàn tất đủ 9 ca (3 lượt đo HTTP mỗi ca lấy median); 26/28 truy vấn mỗi lượt `/store/products` (và 9/9 của `/store/catalog`) được `EXPLAIN (ANALYZE, BUFFERS)` đầy đủ; 2 truy vấn tham số `$1` (`product_product_option_value`, `price/price_list`) ghi chú rõ lý do ngoại lệ ở mục 3.2. | **PASS** |
| **D05-AWS** | Đối chiếu live AWS RDS `commerce` (`ap-southeast-2`) | Không gọi AWS CLI / không thao tác cloud trong DATA-05 | Xác định rõ trạng thái AWS hiện tại còn chưa biết; không thao tác hạ tầng AWS. | Không thực hiện thao tác AWS; ghi nhận trạng thái live AWS là **CHƯA BIẾT**, chuyển sang Tuần 2 theo phân bổ kế hoạch. | **NOT RUN** (phạm vi Tuần 2) |

<a id="query-analysis"></a>
## 3. Báo cáo truy vấn local trên 153 sản phẩm (120 sản phẩm tổng hợp)

### 3.1. Kích thước bảng sau `VACUUM ANALYZE` (`daymark_data05_perf120`)

| Bảng | Số dòng ước lượng (`reltuples`) | Số trang 8 KB (`relpages`) | Dung lượng bảng | Dung lượng index |
| --- | --- | --- | --- | --- |
| `product` | 153 | 8 | 64 kB | 96 kB |
| `product_sales_channel` | 153 | 3 | 24 kB | 96 kB |
| `product_category_product` | 150 | 2 | 16 kB | 32 kB |
| `product_variant` | 713 | 14 | 112 kB | 312 kB |
| `product_variant_option` | 1.423 | 18 | 144 kB | 152 kB |
| `product_variant_price_set` | 713 | 13 | 104 kB | 272 kB |
| `price` | 714 | 17 | 136 kB | 152 kB |
| `inventory_item` | 713 | 12 | 96 kB | 136 kB |
| `inventory_level` | 713 | 27 | 216 kB | 224 kB |

### 3.2. Bảng tổng hợp số đo HTTP và PostgreSQL (9 ca thực tế)

Mọi ca `/store/products` sử dụng đúng danh sách `fields` và tham số của storefront ([apps/storefront/src/lib/data/products.ts](../../apps/storefront/src/lib/data/products.ts)), trong đó hai chế độ `price_asc` / `price_desc` chạy qua hàm `listProductsWithSort` tải toàn bộ sản phẩm khớp theo từng lô tuần tự `limit=100, order=id` rồi sắp xếp trong bộ nhớ bằng `sortProducts` ([sort-products.ts](../../apps/storefront/src/lib/util/sort-products.ts)).

| Ca đo | Endpoint & Tham số | Khớp / Trả về | Số request HTTP | Payload JSON | HTTP median (3 lượt) | Tổng SQL (explained / tổng) | Tổng PG Exec (`EXPLAIN`) | Shared Hit / Read | JS `sortProducts` (warm) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `storefront_created_at_page1` | `GET /store/products?limit=12&offset=0&order=-created_at` | 153 / 12 | 1 | 127,7 KB | **226,32 ms** | 26 / 28 | **2,732 ms** | 143 / 0 | 0 ms (DB sort) |
| `storefront_created_at_page10` | `GET /store/products?limit=12&offset=108&order=-created_at` | 153 / 12 | 1 | 127,7 KB | **202,87 ms** | 26 / 28 | **2,763 ms** | 142 / 0 | 0 ms (DB sort) |
| `storefront_price_asc_batches` | `GET /store/products` × 2 lô (`limit=100, offset=0 & 100, order=id`) | 153 / 153 | **2 tuần tự** | **1.846,2 KB (1,85 MB)** | **1.207,74 ms** (lô 1: 781,3 ms; lô 2: 408,8 ms) | 52 / **56** | **7,993 ms** | 480 / 0 | **2,12–2,29 ms** asc / 1,26–2,23 ms desc (cold JIT: 24,03 ms) |
| `storefront_search_q_everyday_created_at` | `GET /store/products?q=Everyday&limit=12&order=-created_at` | **122** / 12 | 1 | 127,7 KB | **204,57 ms** | 26 / 28 | **3,877 ms** | 206 / 0 | 0 ms (DB sort) |
| `storefront_search_q_everyday_price_asc` | `GET /store/products?q=Everyday` × 2 lô (`limit=100, order=id`) | **122** / 122 | **2 tuần tự** | **1.302,4 KB (1,30 MB)** | **922,17 ms** (lô 1: 664,5 ms; lô 2: 245,9 ms) | 52 / **56** | **10,112 ms** | 526 / 0 | **1,02–1,62 ms** |
| `storefront_category_filter` | `GET /store/products?category_id[]=dm-bags&limit=12&order=-created_at` | 23 / 12 | 1 | 127,8 KB | **195,35 ms** | 26 / 28 | **2,840 ms** | 211 / 0 | 0 ms (DB sort) |
| `storefront_collection_filter` | `GET /store/products?collection_id[]=dm-daily-essentials&limit=12&order=-created_at` | 52 / 12 | 1 | 127,9 KB | **167,76 ms** | 26 / 28 | **2,604 ms** | 157 / 0 | 0 ms (DB sort) |
| `legacy_store_catalog_default` | `GET /store/catalog?limit=20&offset=0` | 153 / 20 | 1 | 63,5 KB | **67,74 ms** | 9 / 9 | **1,126 ms** | 64 / 0 | 0 ms |
| `legacy_store_catalog_search_everyday` | `GET /store/catalog?q=Everyday&limit=20&offset=0` | **122** / 20 | 1 | 63,5 KB | **77,62 ms** | 9 / 9 | **2,306 ms** | 136 / 0 | 0 ms |

*Ghi chú phương pháp đo minh bạch:*
- Trong mỗi lượt 28 truy vấn SQL của `/store/products`, có **2 truy vấn sử dụng extended protocol với tham số vị trí `$1`** (`product_product_option_value JOIN product_product_option` và CTE truy vấn `price` / `price_list`) nên script `psql` độc lập không gắn lại được bind parameter để re-explain; **26/28 truy vấn còn lại** (gồm toàn bộ truy vấn chính trên `product`, `product_sales_channel`, `product_category_product`, `product_variant`, `product_variant_option`, `product_variant_price_set`, `inventory_level` và `COUNT`) đều đã chạy `EXPLAIN (ANALYZE, BUFFERS)` thành công. Chi tiết nằm trong [query-explain-summary.json](evidence/database-migration-query-2026-11-22/query-explain-summary.json).
- Kiểm tra tính đúng đắn của `sortProducts` trên dữ liệu 153 sản phẩm: `minPrice = 189.000 ₫`, `maxPrice = 1.389.000 ₫`, trang 1 trả đúng 12 sản phẩm theo thứ tự giá tăng/giảm dần.

### 3.3. Trích đoạn SQL thực tế và Plan `EXPLAIN (ANALYZE, BUFFERS)` tiêu biểu

#### (a) Lọc kênh bán (`product_sales_channel`) — xuất hiện ở mọi ca `/store/products` và `/store/catalog`
```sql
SELECT l0.sales_channel_id, l0.product_id
FROM product_sales_channel AS l0
WHERE l0.deleted_at IS NULL AND l0.sales_channel_id IN ('<sc_id>');
```
- **Plan:** `Seq Scan on product_sales_channel l0 (actual time=0.019..0.036 rows=153)` · `Buffers: shared hit=3, read=0` · **Execution: 0,096 ms**. (Dù đã có partial index `IDX_sales_channel_id_20b454295`, bảng chỉ dài 3 trang 8 KB và toàn bộ 153/153 dòng thuộc kênh này nên planner chọn `Seq Scan` là tối ưu.)

#### (b) Catalog trang 1 sắp xếp mới nhất (`storefront_created_at_page1`, `order=-created_at, limit=12`)
```sql
SELECT p0.id, p0.title, ..., c2.id AS c2__id, ...
FROM product AS p0
LEFT JOIN product_type AS t1 ON p0.type_id = t1.id AND t1.deleted_at IS NULL
LEFT JOIN product_collection AS c2 ON p0.collection_id = c2.id AND c2.deleted_at IS NULL
LEFT JOIN image AS p3 ON p0.id = p3.product_id
WHERE p0.id IN (
  SELECT p0.id FROM (
    SELECT p0.id FROM product AS p0 ...
    WHERE p0.deleted_at IS NULL AND p0.status = 'published' AND p0.id IN (<153 IDs>)
    GROUP BY p0.id ORDER BY min(p0.created_at) DESC, min(p3.rank) ASC LIMIT 12
  ) AS p0
)
ORDER BY p0.created_at DESC, p3.rank ASC;
```
- **Plan:** Subquery `Seq Scan on product` (8 pages, 153 rows) → `HashAggregate` (40 kB) → `top-N heapsort` (26 kB) → `Limit 12` → `Hash Join` + `Memoize(Index Scan using product_collection_pkey)` → `Sort` (30 kB) · `Buffers: shared hit=28, read=0` · **Execution: 0,556 ms**.
- Truy vấn đếm `COUNT(*)` đi kèm: `Aggregate → Seq Scan on product` (8 pages, `shared hit=8`) · **Execution: 0,109 ms**.
- Hydrate biến thể & tồn kho cho 12 sản phẩm (48 biến thể): `Index Scan` trên `product_variant` (**0,061 ms**) và `Index Scan` trên `inventory_level` (**0,083 ms**).

#### (c) Tìm kiếm từ khóa (`storefront_search_q_everyday_created_at`, `q=Everyday`, khớp 122 sản phẩm)
```sql
SELECT count(distinct(p0.id)) AS count
FROM product AS p0
LEFT JOIN product_type t1 ... LEFT JOIN product_collection c2 ...
LEFT JOIN product_variant p3 ON p0.id = p3.product_id AND p3.deleted_at IS NULL
WHERE (p0.title ILIKE '%Everyday%' OR p0.subtitle ILIKE '%Everyday%' OR p0.description ILIKE '%Everyday%'
    OR p3.title ILIKE '%Everyday%' OR p3.sku ILIKE '%Everyday%' OR p3.barcode ILIKE '%Everyday%'
    OR p3.ean ILIKE '%Everyday%' OR p3.upc ILIKE '%Everyday%')
  AND p0.deleted_at IS NULL AND p0.status = 'published' AND p0.id IN (<153 IDs>);
```
- **Plan (`COUNT(DISTINCT)`):** `Hash Right Join` giữa `Seq Scan on product_variant` (14 pages, 713 rows) và `Seq Scan on product` (8 pages, 153 rows) với bộ lọc 8 cột `ILIKE '%Everyday%'` → `Sort` (quicksort 25 kB, 490 rows) → `Aggregate` · `Buffers: shared hit=25, read=0` · **Execution: 0,771 ms**.
- **Plan (SELECT trang 1):** `Sort` (47 kB) → `Nested Loop Left Join` / `Hash Left Join` · `Buffers: shared hit=67, read=0` · **Execution: 1,215 ms**.

#### (d) Sắp xếp theo giá (`storefront_price_asc_batches`, 2 lô `limit=100, order=id`)
- Lô 1 (`limit=100, offset=0`): `SELECT product` (100 rows, `Sort quicksort 69 kB`, `hit=23`, **0,625 ms**) + `SELECT product_variant` (501 rows, `Seq Scan`, `hit=14`, **0,198 ms**) + `SELECT inventory_level` (501 rows, `Seq Scan`, `hit=27`, **0,229 ms**).
- Lô 2 (`limit=100, offset=100`, trả 53 rows): `SELECT product` (53 rows, `Sort quicksort 49 kB`, `hit=23`, **0,626 ms**) + `SELECT product_variant` (`Index Scan`, 212 rows, **0,092 ms**) + `SELECT inventory_level` (`Index Scan`, 212 rows, **0,118 ms**).
- Tổng **52/56** truy vấn được explain trên cả 2 lô: chỉ **7,993 ms** PG execution (`shared hit=480, read=0`).

<a id="cost-breakdown"></a>
## 4. Đối chiếu số đo PostgreSQL, HTTP và sắp xếp giá

So sánh trực tiếp hai ca hiển thị cùng danh mục 153 sản phẩm (`created_at` trang 1 vs `price_asc` trang 1):

| Phép đo | `created_at` trang 1 (12 SP) | `price_asc` trang 1 (tải 153 SP, lấy 12 SP) |
| --- | --- | --- |
| HTTP local (median 3 lượt) | **226,32 ms**, 1 request, 127,7 KB JSON | **1.207,74 ms**, 2 request tuần tự, **1,85 MB JSON** |
| Thực thi SQL qua `EXPLAIN` độc lập | 2,732 ms (26/28 câu SQL, `read=0`) | 7,993 ms (52/56 câu SQL, `read=0`) |
| Lập kế hoạch SQL qua `psql` độc lập | 94,981 ms | 203,916 ms |
| JS `sortProducts` trong lần đo warm | Không chạy hàm sort giá | 2,12–2,29 ms |

Ba phép đo HTTP, SQL qua `psql` và JS sort có ranh giới riêng. Chi phí lập kế hoạch độc lập và các câu SQL thiếu bind chưa được đo trong luồng HTTP. Phép đo cũng chưa tách được thời gian hydrate, tính giá, tuần tự hóa JSON và truyền tải bên trong thời gian HTTP.

Ở fixture này, HTTP cho ca sắp xếp giá mất **5,34 lần** và trả **14,46 lần** dung lượng JSON của ca `created_at` trang 1. `listProductsWithSort` tải tuần tự toàn bộ 153 sản phẩm khớp, kèm dữ liệu của 713 biến thể, trước khi cắt lấy 12 sản phẩm. Đây là hành vi cần đo lại ở 1.000 sản phẩm để xác định phần độ trễ tăng theo số lô có ảnh hưởng thế nào.

<a id="index-decision"></a>
## 5. Quyết định về Index PostgreSQL

**Quyết định tại checkpoint 22/11/2026: KHÔNG THÊM INDEX MỚI.**

- **Căn cứ số đo:**
  1. Medusa đã có sẵn **40 index** trên nhóm bảng catalog/pricing/inventory (gồm `product_pkey`, `IDX_product_status`, `IDX_product_collection_id`, `IDX_product_handle_unique`, `IDX_sales_channel_id_20b454295`, `product_category_product_pkey`, `IDX_product_variant_product_id`, `IDX_price_price_set_id`, `IDX_inventory_level_inventory_item_id`, v.v.) và **19 index** trên 6 bảng `recommendation_*`.
  2. Ở quy mô 153 sản phẩm / 713 biến thể, tổng thời gian thực thi của phần SQL được `EXPLAIN` theo từng ca là **1,13–10,11 ms**, với `read=0` trong lượt đo. Các plan tiêu biểu chọn `Seq Scan` khi bảng nhỏ hoặc điều kiện khớp phần lớn số dòng. Số đo hiện có chưa cho thấy lợi ích của index mới tại quy mô này.
  3. Tìm kiếm `q` dùng `ILIKE '%...%'` (leading wildcard) trên 8 cột của `product` và `product_variant` — B-tree index thông thường không thể tăng tốc kiểu truy vấn này.
- **Ngưỡng đánh giá lại ở Tuần 2 (benchmark 1.000 sản phẩm):**
  - Chỉ đề xuất tạo migration index mới khi benchmark Tuần 2 đo được tổng thời gian thực thi SQL vượt ngưỡng (ví dụ `> 50 ms`/truy vấn hoặc phát sinh disk read cao), cụ thể xem xét:
    1. `pg_trgm` GIN index cho cột tìm kiếm `product(title, subtitle, description)` / `product_variant(title, sku)` nếu tìm kiếm `q` chậm do 8-column `ILIKE`.
    2. Index đảo chiều `product_category_product(product_category_id, product_id)` nếu lọc theo category (khóa chính hiện tại là `(product_id, product_category_id)`).
    3. Composite partial index `product(status, created_at DESC) WHERE deleted_at IS NULL` nếu `Seq Scan + top-N heapsort` trên `product` tăng mạnh ở quy mô lớn.
  - Đo lại số lô tuần tự, payload, độ trễ từng lô và thời gian PostgreSQL trong luồng HTTP trước khi quyết định cách tối ưu sắp xếp giá.
