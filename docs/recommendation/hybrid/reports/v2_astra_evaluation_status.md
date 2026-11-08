# V2 vs Astra labels — evaluation status

**Cập nhật mới:** Real v2 đã được tạo và chấm sau báo cáo này. Xem [real v2 implementation and evaluation](real_v2_implementation_report.md). Các nhận định thiếu artifact bên dưới chỉ mô tả thời điểm audit trước đó.

**Ngày:** 07/11/2026 Asia/Saigon. **Branch:** `recommendation-pdp`. **Verdict:** NOT_RUN; thiếu artifact v2 thật, không có nDCG@6 v2 hoặc delta v2−v1 để báo.

Audit read-only `data/hm/processed/` (kể cả file Git ignore) chỉ thấy candidate v1 `candidates-product-detail.jsonl`, hai output PDP verification metadata và `hybrid-baseline-evaluation.json` đo coverage cấu trúc. Không có thư mục Hybrid candidate version, file Product/image embeddings hoặc manifest của model. `docs/recommendation/hybrid/reports/final_implementation_report.md` cũng ghi Phase 03 real embeddings BLOCKED và chưa publish Hybrid. Các Playwright Hybrid cases dùng proxy đổi trường `strategy`, không tạo ranking v2.

Phiếu Astra `data/hm/processed/evaluation/v1-frozen-balanced-20261107/astra-labels.jsonl` đã chấm đủ 145 cặp **top6 v1** trên 40 PDP contexts. V1 diagnostic: 133/145 cặp mức ≥1; xem [báo cáo](v1_astra_baseline_report.md). Với v2, cần lấy top6 của **cùng 40 contexts** rồi xác định target nào đã có nhãn và target nào chưa. Target riêng v2 phải được Astra xem cả hai ảnh và chấm mù cùng rubric. Sau đó tính lại v1 và v2 trên cùng pooled labels; chỉ khi ấy mới tính paired macro nDCG@6 và delta. Không xem target chưa chấm là grade 0 vì điều đó làm v2 bị đánh giá sai.

Đường chạy sau khi có v2: `python scripts/hm/evaluate-pdp-relevance.py --sample-manifest data/hm/processed/evaluation/v1-frozen-balanced-20261107/sample-manifest.json --v2 data/hm/processed/hybrid/<version>/candidates-product-detail.jsonl --output data/hm/processed/evaluation/<version>-blind`. Artifact v2 phải có manifest/checksum nguồn, đúng mapping Medusa và candidate strategy Hybrid; nếu là fixture/metadata đổi tên, giữ verdict NOT_RUN. Hai bộ nhãn human vẫn cần cho quality gate chính; Astra labels chỉ là AI proxy.

**Không thay đổi DB, không tạo scores v2 giả, không publish candidate.**
