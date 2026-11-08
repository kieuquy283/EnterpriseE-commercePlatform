# Phase 02 — Sẵn sàng ảnh và mapping

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 00 · **Owner:** Data Engineer · **Estimate:** 2–3 person-days (giả định). Xác minh ảnh đang có thuộc đúng article/Variant/Product trước khi tạo vector. Không tải lại 1.874 ảnh chỉ để đạt số lượng.

**Already exists:** `scripts/hm/build-image-manifest.py`, `validate-images.py`, `image_pipeline.py`, `data/hm/processed/` ignored. Local aggregate ở audit: 1.874 mapped articles, 496 valid JPEGs, 496/500 Products có ít nhất một ảnh; report 06/11 cho biết import vào `recommendation_test`, DB `commerce` lúc đó 0 thumbnails. **Missing:** quyền public và image-model readiness. **Unverified:** DB/ảnh hiện hành có còn khớp, visual identity toàn bộ ảnh.

**Inputs:** `data/hm/processed/catalog.jsonl`, `medusa-mapping.jsonl`, image manifest/JPEG, rights decision. **Outputs:** manifest đã đối chiếu, coverage theo Product/Variant/group, bad/missing list và private/public gate. **Files:** reuse `scripts/hm/build-image-manifest.py`, `validate-images.py`, `tests/test_image_pipeline.py`; proposed kiểm tra mapping bổ sung tại `scripts/hm/tests/test_hybrid_mapping.py`; report `reports/phase_02_report.md` (proposed). Không ghi raw IDs/ảnh vào docs.

1. **P0** Giữ `article_id` string và SKU `HM-...`; so article→Variant→Product với **DB test đích** bằng readback/service (không suy từ count 1.874).
2. **P0** Kiểm SHA/JPEG decode, nguồn/path, duplicate content, missing image, Product ownership; lấy representative hợp lệ và danh sách variants cùng Product.
3. **P0** Ghi quyền private/public, ảnh/embedding derived assets, nơi lưu và quyền truy cập; public NO-GO nếu thiếu.
4. **P1** Lấy mẫu visual để người thật xác nhận ảnh đúng tiêu đề/color; mã file/checksum không chứng minh nội dung thị giác.

**Acceptance:** Given mapping và DB đích, when reconcile, then không stale/duplicate/wrong Product. Given ảnh thiếu/hỏng, then status `missing`/`invalid`, không thế ảnh Product khác. **Commands:** `python scripts/hm/build-image-manifest.py`, `python scripts/hm/validate-images.py`, `python -m unittest discover -s scripts/hm/tests -v` — chỉ thực hiện ở phase triển khai, sau rights/DB gate. **Gate:** PASS private nếu mapping đúng và valid images đủ cho pilot; BLOCKED public nếu rights chưa rõ. **Risk/fallback:** missing 4 Products → metadata-only; main DB thiếu thumbnails không cản embedding private nhưng cản demo public. **Rollback:** không xóa source, chỉ tái sinh manifests private. **Core commerce:** read-only. **Next:** Phase 03. Báo cáo: `reports/phase_02_report.md` (proposed).
