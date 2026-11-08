# Phase 01 — Data & Mapping

Thời điểm: 04/11/2026 12:25 Asia/Saigon. Branch/SHA: recommendation / `6f3c8d99cac44d94f296dbe912ed82d820ac6584` + working changes ghi trong Phase00 và scorer/UI/validator mới. Windows, Node24.15.0, Python3.10.11, Medusa2.21.2; PostgreSQL16.15, DB riêng `recommendation_test`. Không ghi credentials.

## Thực hiện và evidence

| Command thực chạy | Exit | Actual |
| --- | --- | --- |
| `docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml exec -T recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/check-hm-mapping.ts` | 0 | 1874 mappings /500 Products, tất cả variant/product/SKU khớp |
| `python scripts/hm/verify-pdp-candidates.py --output data/hm/processed/pdp-verification/run-a` | 0 | 500 groups,1874 unique article/variant mappings;3198 existing rows valid |
| Cùng lệnh với `run-b` | 0 | Candidate SHA trùng |
| `python -m unittest discover -s scripts/hm/tests -v` | 0 | 8 tests pass, gồm mapping remap/stale grouping rejection |

Validator mới `scripts/hm/verify-pdp-candidates.py` dùng catalog/mapping target tại `data/hm/test-serving/processed`. Mapping SHA256 `2ff289922381173b7533663cfda68046307f42a4045c410e7159e7bc485967f7`. Catalog SHA256 `d00815f6ac454dd6f6410fba1059a58abc92ccf8a916dd0f99162441c313ddf3`. Article IDs kiểm10 digits string; mỗi variant duy nhất; catalog group không split/merge; zero orphan/self candidate references. Không đọc customers hoặc transactions.

Missing/Unknown tại product level: product_type1, product_group1, description1; section/department/garment/index_group0. Phân bố index_group: Ladieswear211, Baby/Children104, Menswear73, Sport23, Divided89. Pilot chọn theo khóa nên có bias; không đại diện toàn bộ H&M. Không có ảnh H&M, không tự tải ảnh.

## Acceptance & review

Identity, grouping, referential validation, coverage và provenance: **PASS** qua read-only service audit + validator. Tính mua được hiện thời được kiểm bằng native Store API ở Phase03, không suy chỉ từ mapping. Bổ sung audit cuối đọc lại105542 rows của articles.csv: tất cả1874 selected article IDs tồn tại, unique và product_code khớp catalog; SHA256 `25f21882053517f7684ea43f524225a9481a7bb9aab9cf0abfc7fe8c4576a72b`. Không đọc lại transactions/customers trong phase này. Final Python suite9 tests, gồm validator replay/stale/duplicate rejection. Giá/tồn kho demo là synthetic theo importer hiện có, không phải H&M thực tế.

Rollback: chỉ artifacts mới trong gitignored `data/hm/processed/pdp-verification`; không sửa catalog/Orders/DB. Verdict **PASS PRIVATE data gate**, rights public **NO-GO**. Giới hạn: chưa có human relevance; zero stale artifacts không đảm bảo sản phẩm luôn saleable sau khi stock/status thay đổi.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
