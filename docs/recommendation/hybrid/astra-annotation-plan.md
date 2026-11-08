# Kế hoạch gán nhãn PDP bằng Astra trong phiên Codex

**Phạm vi:** Phiếu chấm v1 đã khóa tại `data/hm/processed/evaluation/v1-frozen-balanced-20261107/`: 40 PDP contexts, 145 cặp source–candidate, 115 ảnh local khác nhau. Mục tiêu lượt này là tạo **AI-judged proxy labels cho v1**, chưa chấm v2 và chưa tuyên bố ground truth của người thật.

1. **Nguồn và bảo mật.** Chỉ đọc `blind-pairs.jsonl` và ảnh tại `data/hm/<image_source_path>`. Không đọc rank/score/model để chấm; không tải ảnh lên kho public, không commit ảnh, IDs hay nhãn. Yêu cầu người dùng dùng Astra trong Codex là ủy quyền xử lý private của lượt này; quyền phát hành ảnh H&M vẫn chưa được xác minh.
2. **Quan sát bắt buộc.** Astra phải mở **cả hai ảnh thật** của từng cặp. Title/description chỉ giúp phân biệt chi tiết khó nhìn; Product type/index group không tự động quyết định nhãn. Nếu không xem được ảnh thì để unresolved, không gán nhãn đoán.
3. **Rubric cố định.** `0`: khác loại/chức năng hoặc không thể thay thế. `1`: có nét giống và có thể cân nhắc thay thế trong một số trường hợp. `2`: rất tương tự về loại, kiểu dáng và công dụng, có thể thay thế. Màu là yếu tố phụ. Mỗi nhãn kèm lý do ngắn và confidence `low/medium/high`.
4. **Artifact.** Ghi private `astra-labels.jsonl`, mỗi record có `context_product_id`, `candidate_product_id`, `reviewer_id = astra-codex-20261107`, `grade`, `reason`, `confidence`, `inspected_images = true`. Nếu chưa chấm đủ, ghi số hoàn tất và các cặp unresolved, không điền nhãn mặc định.
5. **QA.** Chạy `python scripts/hm/validate-astra-labels.py --packet data/hm/processed/evaluation/v1-frozen-balanced-20261107/blind-pairs.jsonl --labels data/hm/processed/evaluation/v1-frozen-balanced-20261107/astra-labels.jsonl`. Validator kiểm đúng 145 cặp duy nhất, IDs khớp packet, grade trong 0–2, đường dẫn hai ảnh tồn tại, `inspected_images=true`, lý do/confidence có mặt; xuất phân bố nhãn và confidence. Không tạo reviewer thứ hai giả hoặc dùng cùng một AI run làm hai người đánh giá độc lập.
6. **Đánh giá sau nhãn.** Nhãn Astra chỉ là proxy để tìm lỗi và chọn cặp cần người thật kiểm tra. Khi v2 có candidates thật, tạo pooled packet mới với cùng 40 contexts và chấm các cặp mới; không chọn lại mẫu theo kết quả v2. Để ra kết luận chất lượng đáng tin cậy cần human audit và holdout độc lập nếu có tuning.

**Exit gate lượt này:** nhãn Astra cho 145 cặp có bằng chứng xem ảnh và validation đầy đủ, hoặc trạng thái PARTIAL nêu chính xác cặp chưa chấm. Không tính/khẳng định v1–v2 accuracy khi v2 artifact chưa tồn tại.

**Kết quả:** exit gate AI annotation đạt 145/145 cặp; xem [báo cáo thực hiện](reports/astra_annotation_report.md). Human ground truth và so sánh v1–v2 vẫn chưa chạy.
