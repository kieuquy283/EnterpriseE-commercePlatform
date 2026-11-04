# Phase 01 — Data readiness & đối soát H&M ↔ Medusa

> **ID:** REC-PDP-P01 · **Phụ thuộc:** P00 PASS private · **Ưu tiên:** P0
> **Spec:** `PDP-DATA-01..04`, `PDP-T02` trong [spec.md](spec.md).
> **Report:** `docs/recommendation/pdp/reports/phase_01_report.md`.

## 1. Mô tả đơn giản

Đảm bảo rằng mã sản phẩm H&M trong file CSV **đúng là sản phẩm đang có trong Medusa**, không nhầm Product với Variant, và có đủ metadata để tìm những sản phẩm giống nhau.

## 2. Đầu vào

- `data/hm/processed/catalog.jsonl`, `manifest.json`, `medusa-mapping.jsonl` (local, ignored).
- DB target được xác minh là test/dev, Medusa catalog/variants có quyền đọc.
- `scripts/hm/profile-interactions.py` và reports cũ; không cần `customers.csv` để tính Similarity.

## 3. Việc cần làm

1. Đọc manifest: total products/articles, source checksums, grouping rule; kiểm tra `article_id` là chuỗi 10 chữ số theo dataset và không mất leading zeros.
2. Xác minh mỗi `article_id` → duy nhất một `HM-{article_id}` SKU → một Medusa Variant → đúng một Medusa Product. Nhiều article IDs được phép cùng Product.
3. Đối chiếu IDs bằng Medusa service/query **read-only** hoặc export kiểm toán; không lấy mapping file ở DB khác để publish trực tiếp.
4. Kiểm tra metadata tối thiểu: `product_type`, `product_group`, `index_group`, `section`, `department`, `garment_group`, variants colors, description. Báo tỉ lệ thiếu theo field.
5. Đọc existing candidate files; đối soát mọi `context_key=product:<id>` và `target_product_id` đều thuộc target catalog. Product thiếu/mapping thay đổi → fail fast, không âm thầm thay ID.
6. Với catalog mới (nếu cần), dùng `scripts/hm/remap-candidates.py` sau khi **cùng article universe, cùng grouping rule** đã xác nhận; regenerate với version mới, không chỉnh ready version.
7. Đo số Product contexts có ít nhất 1/3/6 Similar candidates; document bias do 500 Products được chọn theo thứ tự khóa. Không bắt buộc import 5k nếu pilot đủ để chứng minh.
8. Lập report data quality và check quyền dùng ảnh/metadata trong private/public demo.

## 4. File code dự kiến

- Reuse `scripts/hm/profile-interactions.py`, `scripts/hm/remap-candidates.py`, `apps/backend/src/scripts/check-hm-mapping.ts`.
- Chỉ thêm validator hoặc test tại `scripts/hm/tests/` nếu coverage còn thiếu; raw artifacts giữ ngoài Git.

## 5. Acceptance criteria

| Gate | Expected | Evidence |
|---|---|---|
| Identity | Không duplicate `article_id` mapping, đúng Product/Variant/SKU | DB readback + script test |
| Candidate referential | 0 missing/stale target/context IDs sau validation | JSON aggregate + failing negative test |
| Metadata | Có field coverage report; thiếu field được xử lý an toàn | Profile summary |
| Traceability | SHA dataset/manifest/mapping, version, target DB environment | Scrubbed report |
| Privacy | Không commit CSV, customer IDs/hashes hoặc DB snapshot | `git diff`/ignore check |

## 6. Test & review

Chạy Python unit tests/profile; nếu cần DB readback, dùng DB test có kiểm soát. Review do Data owner + Backend owner; kiểm tra các trường hợp article ID không hợp lệ, SKU trùng và mapping stale.

## 7. Exit gate

**PASS** khi mapping/catalog trong DB target khớp, zero orphan candidate references và có report distribution/coverage. Nếu chưa có DB phù hợp, `BLOCKED` cho publisher/API nghiệm thu; có thể hoàn thiện offline validators nhưng không đánh dấu full PASS.

## 8. Khi gặp lỗi

Không sửa Medusa core tables bằng SQL. Không xóa 500 Products cũ để import lại. Ghi bản ghi mismatch, sửa ETL/import qua workflow và tạo candidate version mới.
