# Phase 02 — H&M Metadata Similarity offline

> **ID:** REC-PDP-P02 · **Phụ thuộc:** P01 PASS · **Ưu tiên:** P0
> **Spec:** `PDP-ALG-01/02`, `PDP-T01/T13` trong [spec.md](spec.md).
> **Report:** `docs/recommendation/pdp/reports/phase_02_report.md`.

## 1. Mô tả đơn giản

Dùng loại/nhóm/màu/mô tả của H&M để tạo sẵn danh sách sản phẩm tương tự cho mỗi Medusa Product. Khách mở PDP thì API chỉ **đọc kết quả đã tính**, không phải chạy thuật toán.

## 2. Đầu vào

- Catalog/mapping đã nghiệm thu Phase 01.
- Code sẵn có `scripts/hm/build-mvp-candidates.py` và `scripts/hm/tests/test_mvp_candidates.py`.
- `docs/recommendation/similarity-review-protocol.md`, evidence private từ phase cũ (tham khảo, không dùng thay run mới).

## 3. Việc cần làm

1. Reuse scorer hiện tại: blocking cùng `index_group`; phải match `product_type` hoặc `product_group` trước khi tính điểm.
2. Kiểm tra field weights/normalization theo spec; với giá trị thiếu/unknown không cộng điểm và không chia sai mẫu số. Threshold khởi đầu **0.70** chỉ là baseline private.
3. Sinh tối đa Top 100 **target Product IDs** cho mỗi source Product; loại self/product ID trùng; thứ tự score giảm, hòa điểm theo ID cố định.
4. Tính/so sánh **Exact Category Match baseline**; report fraction contexts với ≥1/≥3/≥6 candidates và số candidate bằng 0.
5. Kiểm tra kết quả sinh hai lần từ cùng inputs/cấu hình có byte hash giống nhau; khác source/scoring phải dùng `version` mới, không ghi đè active ready run.
6. Tổ chức **human relevance review** tối thiểu 20 PDP contexts trải theo nhóm/tần suất/số candidate. Với mỗi top-6 và baseline, reviewer chấm `0=không phù hợp, 1=tạm, 2=phù hợp`, lý do và thông tin có/không có ảnh. Agent self-review không thay thế human review.
7. Không dùng H&M transactions làm nhãn 'sản phẩm trông giống nhau'; nếu dùng interaction để bổ sung đánh giá hành vi phải ghi proxy limitations rõ ràng.
8. Lưu output versioned tại `data/hm/processed/candidates-product-detail.jsonl`, manifest, summary; không đưa raw candidate records hạn chế vào Git.

## 4. File code dự kiến

- Giữ `scripts/hm/build-mvp-candidates.py` (chỉ sửa nếu bug/spec gap).
- Bổ sung/giữ `scripts/hm/tests/test_mvp_candidates.py`.
- Xuất report aggregate ở `docs/recommendation/pdp/reports/phase_02_report.md`; human review evidence không chứa PII.

## 5. Test cases

- Cùng group/type/màu phải đứng trên ứng viên unrelated trong controlled fixture.
- Khác `index_group` phải score 0; không self; không duplicate; không vượt 100 candidates/context.
- Trường thiếu/unknown, không có description, color set rỗng: không exception/NaN.
- Tie-break deterministic; đổi threshold ảnh hưởng kết quả theo dự đoán; replay cho cùng hash.
- Input mapping chứa target không tồn tại phải fail validation trước publish.

## 6. Exit gate

**Technical PASS private:** Tests deterministic, valid JSONL/context, candidate universe khớp DB, baseline/coverage đã báo cáo. **Human relevance chưa thực hiện → status `NOT_RUN`, public quality gate `BLOCKED`**, không được đổi thành PASS. Nếu score 0.70 làm phần lớn PDP thiếu 6 ứng viên, thiết kế fallback để xử lý thay vì hạ ngưỡng tùy tiện chỉ để đủ thẻ.

## 7. Rollback

Giữ version trước, tạo version mới khi sửa scoring; publisher không đổi active khi chưa nghiệm thu. Chỉ xóa artifacts có thể tái tạo trong test data, không xóa dataset gốc.
