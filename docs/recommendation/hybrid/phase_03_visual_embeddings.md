# Phase 03 — Visual embeddings offline

**Status:** PLANNED · **Priority:** P0 · **Dependencies:** 02 · **Owner:** ML Engineer · **Estimate:** 3–5 person-days (giả định). Một encoder pretrained biến ảnh thành vector để so độ giống thị giác. Chạy theo batch ngoài đường HTTP, và chỉ dùng ảnh đã xác thực thuộc đúng Product.

**Already exists:** ảnh/derivatives pipeline tại `scripts/hm/image_pipeline.py`, manifest/checksum, 496 valid theo local summary. **Missing:** encoder, vector artifacts, model/license decision. **Unverified:** dimension, tốc độ, RAM/VRAM/disk và chất lượng của bất kỳ CLIP/SigLIP model nào.

**Inputs:** valid article JPEGs + mapping + model weights/license được review. **Outputs:** article vectors, Product vectors, manifests/checksums, resource profile. **Files proposed:** `scripts/hm/build-visual-embeddings.py`, `scripts/hm/visual_features.py`, `scripts/hm/tests/test_visual_features.py`; ignored `data/hm/processed/hybrid/embeddings/`; `reports/phase_03_report.md`. Không sửa Medusa core.

1. **P0** So ít nhất hai encoder CPU-capable theo license, dimension thực tế, dependency size, chạy thử 20 ảnh trên đúng VM/test host; chọn một sau khi đo.
2. **P0** Cố định preprocess (resize/crop/color/normalization), model weights SHA, dependency lock/version; batch nhỏ có checkpoint và resume theo image SHA+model SHA+preprocess SHA.
3. **P0** L2-normalize finite vectors, reject zero/NaN; cosine và deterministic ordering trên fixture. Bảo vệ memory bằng batch-size/config.
4. **P0** Gộp article→Product: baseline representative hợp lệ thấp nhất theo rule image manifest; thử normalized mean pooling nhiều variants có ảnh và so coverage/chất lượng/chi phí. Không lấy ảnh từ Product khác.
5. **P1** Đo wall time, peak CPU/RAM/VRAM, artifact bytes và số ảnh/Product thiếu; không suy cost production từ pilot một máy.

**Acceptance:** Given cùng ảnh/model/config, when chạy lại, then checksum vector và Product mapping/rank test giống nhau trong cùng environment; float tolerance nêu trước nếu cross-hardware. Given Product không ảnh, then không tạo vector giả và bật metadata fallback. **Test:** proposed `python -m unittest scripts/hm/tests/test_visual_features.py -v`, pilot inference trên private fixtures/valid JPEGs; không chạy trong planning. **Gate:** PASS khi license cho phạm vi private, vectors hữu hạn/đúng mapping và resource budget đo được; BLOCKED nếu không được dùng model/ảnh hoặc VM thiếu tài nguyên. **Risk/fallback:** processor yếu → representative-only, giảm batch; vẫn metadata-only nếu không khả thi. **Rollback:** giữ metadata active run, bỏ private vector run chưa publish. **Core commerce:** không ảnh hưởng. **Next:** 04. Báo cáo: `reports/phase_03_report.md` (proposed).
