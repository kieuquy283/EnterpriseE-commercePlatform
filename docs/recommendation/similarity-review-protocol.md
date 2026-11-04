# Similarity validation gate

Private technical gate đã dùng agent metadata review 20 contexts theo [ADR](adr-private-validation.md). Human review vẫn NOT_RUN: agent không được tự điền nhãn human review. Quy trình dưới đây dành cho đánh giá chất lượng bằng người thật trước public release/tuyên bố chất lượng.

Dữ liệu review nằm local tại `data/hm/processed/similarity-review.json` (gitignored), gồm tiêu đề, loại sản phẩm, Top 6 cùng score và baseline Exact Category Match. Không đưa nội dung artifact này lên Git hoặc public demo. Metadata similarity không đồng nghĩa giống nhau về hình ảnh; chưa có ảnh hợp pháp trong pilot.

Chọn ít nhất 20 contexts đại diện nhiều product types/index groups, gồm cả ít/không có neighbors. Với mỗi context ghi reviewer, ngày, mức liên quan của từng neighbor (0: không liên quan, 1: chấp nhận, 2: phù hợp), lý do, kết quả baseline cùng rubric. Đừng chọn các contexts dựa trên test purchase history.

Sau review, tổng hợp tỷ lệ liên quan Top 6, coverage và lỗi taxonomy/missing features. So sánh các threshold trên tập review/validation, chốt threshold/weights có lý do, rồi build lại artifacts và chạy tests. Threshold private hiện là 0.70, chưa được human validation.

Khi chưa có human review, private implementation vẫn được kiểm thử theo contract 1.1; public relevance/release gate chưa đạt. Không biến kiểm tra cấu trúc hoặc taxonomy agreement thành bằng chứng human relevance.
